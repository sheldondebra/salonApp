<?php

namespace App\Services;

use App\Enums\PaymentRequestReason;
use App\Enums\PaymentRequestStatus;
use App\Models\Appointment;
use App\Models\PaymentRequest;
use App\Models\Sale;
use App\Models\SmsPurchaseInvoice;
use App\Models\User;
use App\Support\PaymentReferenceGenerator;
use App\Support\TenantContext;
use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PaymentRequestService
{
    public function __construct(
        private readonly PaymentReferenceGenerator $references,
    ) {}

    public function list(array $filters = []): LengthAwarePaginator
    {
        $query = $this->baseQuery()
            ->with([
                'customer:id,name,email,phone',
                'requestedBy:id,name,email',
                'branch:id,name',
                'booking:id,uuid,starts_at',
                'posSale:id,uuid,sale_number',
            ]);

        $this->applyFilters($query, $filters);

        $perPage = min((int) ($filters['per_page'] ?? 20), 100);

        return $query
            ->orderByDesc('created_at')
            ->paginate($perPage);
    }

    public function findForTenant(int $id): PaymentRequest
    {
        return $this->baseQuery()
            ->with([
                'customer:id,name,email,phone',
                'requestedBy:id,name,email',
                'branch:id,name',
                'booking:id,uuid,starts_at,service_id',
                'booking.service:id,name',
                'posSale:id,uuid,sale_number,total_cents',
                'smsPurchaseInvoice:id,amount_cents,currency,status',
            ])
            ->findOrFail($id);
    }

  /**
   * @param  array<string, mixed>  $data
   */
    public function create(array $data, User $requestedBy): PaymentRequest
    {
        $this->assertNotAlreadyPaid($data);
        $this->assertValidLinks($data);

        $expiresHours = (int) config('booking.payment_request_expiry_hours', 24);

        return DB::transaction(function () use ($data, $requestedBy, $expiresHours) {
            return PaymentRequest::query()->create([
                'tenant_id' => TenantContext::id(),
                'branch_id' => $data['branch_id'] ?? null,
                'customer_id' => $data['customer_id'] ?? null,
                'booking_id' => $data['booking_id'] ?? null,
                'invoice_id' => $data['invoice_id'] ?? null,
                'pos_sale_id' => $data['pos_sale_id'] ?? null,
                'sms_purchase_invoice_id' => $data['sms_purchase_invoice_id'] ?? null,
                'requested_by_user_id' => $requestedBy->id,
                'amount_cents' => (int) $data['amount_cents'],
                'currency' => strtoupper((string) ($data['currency'] ?? 'GHS')),
                'phone' => $this->normalizePhone((string) $data['phone']),
                'email' => $data['email'] ?? null,
                'gateway' => strtolower((string) $data['gateway']),
                'payment_channel' => $data['payment_channel'] ?? 'mobile_money',
                'reason' => $data['reason'],
                'description' => $data['description'] ?? null,
                'reference' => $this->references->generate(),
                'status' => PaymentRequestStatus::Pending,
                'expires_at' => Carbon::now()->addHours($expiresHours),
            ]);
        });
    }

    /** @return array<string, int> */
    public function summary(): array
    {
        $base = PaymentRequest::query()->where('tenant_id', TenantContext::id());

        return [
            'pending' => (clone $base)->where('status', PaymentRequestStatus::Pending->value)->count(),
            'processing' => (clone $base)->where('status', PaymentRequestStatus::Processing->value)->count(),
            'success' => (clone $base)->where('status', PaymentRequestStatus::Success->value)->count(),
            'failed' => (clone $base)->where('status', PaymentRequestStatus::Failed->value)->count(),
            'expired' => (clone $base)->where('status', PaymentRequestStatus::Expired->value)->count(),
            'cancelled' => (clone $base)->where('status', PaymentRequestStatus::Cancelled->value)->count(),
        ];
    }

    /** @param  Builder<PaymentRequest>  $query */
    private function applyFilters(Builder $query, array $filters): void
    {
        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (! empty($filters['gateway'])) {
            $query->where('gateway', $filters['gateway']);
        }

        if (! empty($filters['reason'])) {
            $query->where('reason', $filters['reason']);
        }

        if (! empty($filters['customer_id'])) {
            $query->where('customer_id', (int) $filters['customer_id']);
        }

        if (! empty($filters['date_from'])) {
            $query->whereDate('created_at', '>=', $filters['date_from']);
        }

        if (! empty($filters['date_to'])) {
            $query->whereDate('created_at', '<=', $filters['date_to']);
        }

        if (! empty($filters['q'])) {
            $term = '%'.strtolower(trim((string) $filters['q'])).'%';
            $query->where(function (Builder $inner) use ($term) {
                $inner->whereRaw('LOWER(reference) LIKE ?', [$term])
                    ->orWhereRaw('LOWER(phone) LIKE ?', [$term])
                    ->orWhereHas('customer', fn (Builder $c) => $c
                        ->whereRaw('LOWER(name) LIKE ?', [$term])
                        ->orWhereRaw('LOWER(email) LIKE ?', [$term]));
            });
        }
    }

    private function baseQuery(): Builder
    {
        return PaymentRequest::query()->where('tenant_id', TenantContext::id());
    }

    private function normalizePhone(string $phone): string
    {
        $digits = preg_replace('/\D+/', '', $phone) ?? '';

        if (str_starts_with($digits, '0') && strlen($digits) === 10) {
            return '+233'.substr($digits, 1);
        }

        if (str_starts_with($digits, '233')) {
            return '+'.$digits;
        }

        if (str_starts_with($phone, '+')) {
            return $phone;
        }

        return $phone;
    }

    /** @param  array<string, mixed>  $data */
    private function assertNotAlreadyPaid(array $data): void
    {
        if (! empty($data['booking_id'])) {
            $booking = Appointment::query()->find($data['booking_id']);
            if ($booking && $booking->payment_status === 'paid') {
                throw ValidationException::withMessages([
                    'booking_id' => ['This booking is already paid.'],
                ]);
            }
        }

        if (! empty($data['pos_sale_id'])) {
            $sale = Sale::query()->find($data['pos_sale_id']);
            if ($sale && $sale->status === \App\Enums\SaleStatus::Completed && $sale->payment_method) {
                throw ValidationException::withMessages([
                    'pos_sale_id' => ['This POS sale is already paid.'],
                ]);
            }
        }

        if (! empty($data['invoice_id'])) {
            $invoice = \App\Models\TenantInvoice::query()->find($data['invoice_id']);
            if ($invoice && $invoice->status === \App\Enums\InvoiceStatus::Paid) {
                throw ValidationException::withMessages([
                    'invoice_id' => ['This invoice is already paid.'],
                ]);
            }
        }

        if (! empty($data['sms_purchase_invoice_id'])) {
            $invoice = SmsPurchaseInvoice::query()->find($data['sms_purchase_invoice_id']);
            if ($invoice && $invoice->status === 'paid') {
                throw ValidationException::withMessages([
                    'sms_purchase_invoice_id' => ['This SMS invoice is already paid.'],
                ]);
            }
        }
    }

    /** @param  array<string, mixed>  $data */
    private function assertValidLinks(array $data): void
    {
        $reason = $data['reason'] ?? null;

        if ($reason === PaymentRequestReason::BookingPayment->value || $reason === PaymentRequestReason::DepositPayment->value) {
            if (empty($data['booking_id'])) {
                throw ValidationException::withMessages([
                    'booking_id' => ['A booking is required for this payment reason.'],
                ]);
            }
        }

        if ($reason === PaymentRequestReason::PosSale->value && empty($data['pos_sale_id'])) {
            throw ValidationException::withMessages([
                'pos_sale_id' => ['A POS sale is required for this payment reason.'],
            ]);
        }

        if ($reason === PaymentRequestReason::InvoicePayment->value && empty($data['invoice_id'])) {
            throw ValidationException::withMessages([
                'invoice_id' => ['An invoice is required for this payment reason.'],
            ]);
        }
    }
}
