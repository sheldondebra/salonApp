<?php

namespace App\Services;

use App\Enums\InvoiceStatus;
use App\Enums\PaymentRequestReason;
use App\Enums\PaymentRequestStatus;
use App\Models\Appointment;
use App\Models\PaymentRequest;
use App\Models\Sale;
use App\Models\TenantInvoice;
use App\Models\TenantInvoiceItem;
use App\Models\TenantInvoicePayment;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class TenantInvoiceService
{
    /** @param  array<string, mixed>  $filters */
    public function paginate(int $tenantId, array $filters = [], int $perPage = 20): LengthAwarePaginator
    {
        $query = $this->baseQuery($tenantId)
            ->with(['customer:id,name,email,phone', 'branch:id,name']);

        $this->applyFilters($query, $filters);

        return $query
            ->orderByDesc('created_at')
            ->paginate(min(max($perPage, 1), 100));
    }

    public function find(int $tenantId, int $invoiceId): TenantInvoice
    {
        return $this->baseQuery($tenantId)
            ->with([
                'customer:id,name,email,phone',
                'branch:id,name',
                'createdBy:id,name,email',
                'booking:id,uuid,starts_at',
                'posSale:id,uuid,sale_number',
                'items',
                'payments.recordedBy:id,name',
                'payments.paymentRequest:id,reference,status,gateway',
                'paymentRequests:id,invoice_id,reference,status,amount_cents,gateway,created_at',
            ])
            ->findOrFail($invoiceId);
    }

    /**
     * @param  array<string, mixed>  $data
     * @param  list<array{description: string, quantity?: int, unit_price_cents: int}>  $items
     */
    public function createManual(int $tenantId, array $data, array $items, User $user): TenantInvoice
    {
        if ($items === []) {
            throw ValidationException::withMessages([
                'items' => ['Add at least one line item.'],
            ]);
        }

        return DB::transaction(function () use ($tenantId, $data, $items, $user) {
            $invoice = TenantInvoice::query()->create([
                'tenant_id' => $tenantId,
                'branch_id' => $data['branch_id'] ?? null,
                'customer_id' => $data['customer_id'] ?? null,
                'created_by_user_id' => $user->id,
                'invoice_number' => $this->nextInvoiceNumber($tenantId),
                'status' => InvoiceStatus::Draft,
                'discount_total_cents' => (int) ($data['discount_total_cents'] ?? 0),
                'tax_total_cents' => (int) ($data['tax_total_cents'] ?? 0),
                'currency' => $data['currency'] ?? 'GHS',
                'due_date' => $data['due_date'] ?? null,
                'notes' => $data['notes'] ?? null,
                'terms' => $data['terms'] ?? null,
            ]);

            $this->syncItems($invoice, $items);
            $this->recalculate($invoice);

            return $this->find($tenantId, $invoice->id);
        });
    }

    public function createFromBooking(int $tenantId, int $bookingId, User $user): TenantInvoice
    {
        $booking = Appointment::query()
            ->where('tenant_id', $tenantId)
            ->with(['client:id,name,email,phone', 'service:id,name,price_cents', 'location:id,name'])
            ->findOrFail($bookingId);

        $existing = TenantInvoice::query()
            ->where('tenant_id', $tenantId)
            ->where('booking_id', $bookingId)
            ->whereNotIn('status', [InvoiceStatus::Cancelled->value, InvoiceStatus::Refunded->value])
            ->first();

        if ($existing) {
            return $this->find($tenantId, $existing->id);
        }

        $amount = max(0, (int) ($booking->amount_due_cents ?? 0) - (int) ($booking->deposit_paid_cents ?? 0));
        if ($amount <= 0 && $booking->service) {
            $amount = (int) ($booking->service->price_cents ?? 0);
        }

        $description = $booking->service?->name ?? 'Booking payment';
        $data = [
            'customer_id' => $booking->client_user_id,
            'branch_id' => $booking->location_id,
            'due_date' => $booking->starts_at?->toDateString(),
            'notes' => $booking->notes,
        ];
        $items = [
            ['description' => $description, 'quantity' => 1, 'unit_price_cents' => max(1, $amount)],
        ];

        return DB::transaction(function () use ($tenantId, $data, $items, $user, $bookingId) {
            $invoice = TenantInvoice::query()->create([
                'tenant_id' => $tenantId,
                'branch_id' => $data['branch_id'] ?? null,
                'customer_id' => $data['customer_id'] ?? null,
                'booking_id' => $bookingId,
                'created_by_user_id' => $user->id,
                'invoice_number' => $this->nextInvoiceNumber($tenantId),
                'status' => InvoiceStatus::Draft,
                'discount_total_cents' => (int) ($data['discount_total_cents'] ?? 0),
                'tax_total_cents' => (int) ($data['tax_total_cents'] ?? 0),
                'currency' => $data['currency'] ?? 'GHS',
                'due_date' => $data['due_date'] ?? null,
                'notes' => $data['notes'] ?? null,
                'terms' => $data['terms'] ?? null,
            ]);

            $this->syncItems($invoice, $items);
            $this->recalculate($invoice);

            return $this->find($tenantId, $invoice->id);
        });
    }

    public function createFromPosSale(int $tenantId, int $saleId, User $user): TenantInvoice
    {
        $sale = Sale::query()
            ->where('tenant_id', $tenantId)
            ->with(['client:id,name,email,phone', 'items', 'location:id,name'])
            ->findOrFail($saleId);

        $existing = TenantInvoice::query()
            ->where('tenant_id', $tenantId)
            ->where('pos_sale_id', $saleId)
            ->whereNotIn('status', [InvoiceStatus::Cancelled->value, InvoiceStatus::Refunded->value])
            ->first();

        if ($existing) {
            return $this->find($tenantId, $existing->id);
        }

        $items = $sale->items->isNotEmpty()
            ? $sale->items->map(fn ($item) => [
                'description' => $item->name ?? 'POS item',
                'quantity' => max(1, (int) ($item->quantity ?? 1)),
                'unit_price_cents' => (int) ($item->unit_price_cents ?? $item->total_cents ?? 0),
            ])->all()
            : [['description' => 'POS sale '.($sale->sale_number ?? ''), 'quantity' => 1, 'unit_price_cents' => max(1, (int) $sale->total_cents)]];

        return DB::transaction(function () use ($tenantId, $sale, $items, $user, $saleId) {
            $invoice = $this->createManual($tenantId, [
                'customer_id' => $sale->client_user_id,
                'branch_id' => $sale->location_id,
                'currency' => $sale->currency ?? 'GHS',
                'discount_total_cents' => (int) ($sale->discount_cents ?? 0),
                'tax_total_cents' => (int) ($sale->tax_cents ?? 0),
            ], $items, $user);

            $invoice->update(['pos_sale_id' => $saleId]);

            return $this->find($tenantId, $invoice->id);
        });
    }

    /**
     * @param  array<string, mixed>  $data
     * @param  list<array{description: string, quantity?: int, unit_price_cents: int}>|null  $items
     */
    public function update(int $tenantId, TenantInvoice $invoice, array $data, ?array $items, User $user): TenantInvoice
    {
        abort_unless($invoice->tenant_id === $tenantId, 404);

        if ($invoice->status !== InvoiceStatus::Draft) {
            throw ValidationException::withMessages([
                'status' => ['Only draft invoices can be edited.'],
            ]);
        }

        return DB::transaction(function () use ($invoice, $data, $items, $tenantId) {
            $invoice->update([
                'branch_id' => $data['branch_id'] ?? $invoice->branch_id,
                'customer_id' => $data['customer_id'] ?? $invoice->customer_id,
                'discount_total_cents' => (int) ($data['discount_total_cents'] ?? $invoice->discount_total_cents),
                'tax_total_cents' => (int) ($data['tax_total_cents'] ?? $invoice->tax_total_cents),
                'due_date' => $data['due_date'] ?? $invoice->due_date,
                'notes' => array_key_exists('notes', $data) ? $data['notes'] : $invoice->notes,
                'terms' => array_key_exists('terms', $data) ? $data['terms'] : $invoice->terms,
            ]);

            if ($items !== null) {
                $this->syncItems($invoice, $items);
            }

            $this->recalculate($invoice->fresh(['items', 'payments']));

            return $this->find($tenantId, $invoice->id);
        });
    }

    public function send(int $tenantId, TenantInvoice $invoice): TenantInvoice
    {
        abort_unless($invoice->tenant_id === $tenantId, 404);

        if (in_array($invoice->status, [InvoiceStatus::Cancelled, InvoiceStatus::Paid, InvoiceStatus::Refunded], true)) {
            throw ValidationException::withMessages([
                'status' => ['This invoice cannot be sent.'],
            ]);
        }

        $invoice->update([
            'status' => InvoiceStatus::Sent,
            'sent_at' => now(),
        ]);

        return $this->find($tenantId, $invoice->id);
    }

    /** @param  array<string, mixed>  $data */
    public function recordPayment(int $tenantId, TenantInvoice $invoice, array $data, User $user): TenantInvoice
    {
        abort_unless($invoice->tenant_id === $tenantId, 404);

        if (in_array($invoice->status, [InvoiceStatus::Cancelled, InvoiceStatus::Paid, InvoiceStatus::Refunded], true)) {
            throw ValidationException::withMessages([
                'status' => ['This invoice cannot accept payments.'],
            ]);
        }

        $amount = (int) $data['amount_cents'];
        if ($amount < 1) {
            throw ValidationException::withMessages([
                'amount_cents' => ['Payment amount must be at least 1.'],
            ]);
        }

        return DB::transaction(function () use ($tenantId, $invoice, $data, $user, $amount) {
            TenantInvoicePayment::query()->create([
                'tenant_id' => $tenantId,
                'tenant_invoice_id' => $invoice->id,
                'payment_method' => $data['payment_method'] ?? 'cash',
                'amount_cents' => $amount,
                'reference' => $data['reference'] ?? null,
                'payment_request_id' => $data['payment_request_id'] ?? null,
                'recorded_by_user_id' => $user->id,
                'paid_at' => $data['paid_at'] ?? now(),
                'notes' => $data['notes'] ?? null,
            ]);

            $this->recalculate($invoice->fresh(['items', 'payments']));

            return $this->find($tenantId, $invoice->id);
        });
    }

    public function applyPaymentRequest(PaymentRequest $paymentRequest): void
    {
        if (! $paymentRequest->invoice_id || $paymentRequest->reason !== PaymentRequestReason::InvoicePayment) {
            return;
        }

        if ($paymentRequest->status !== PaymentRequestStatus::Success) {
            return;
        }

        $invoice = TenantInvoice::query()->find($paymentRequest->invoice_id);
        if (! $invoice) {
            return;
        }

        $already = TenantInvoicePayment::query()
            ->where('payment_request_id', $paymentRequest->id)
            ->exists();

        if ($already) {
            return;
        }

        $userId = $paymentRequest->requested_by_user_id;

        $this->recordPayment($invoice->tenant_id, $invoice, [
            'amount_cents' => (int) $paymentRequest->amount_cents,
            'payment_method' => 'mobile_money',
            'reference' => $paymentRequest->reference,
            'payment_request_id' => $paymentRequest->id,
            'paid_at' => $paymentRequest->paid_at ?? now(),
            'notes' => 'MoMo payment request',
        ], User::query()->find($userId) ?? User::query()->findOrFail($userId));
    }

    public function cancel(int $tenantId, TenantInvoice $invoice): TenantInvoice
    {
        abort_unless($invoice->tenant_id === $tenantId, 404);

        if (in_array($invoice->status, [InvoiceStatus::Paid, InvoiceStatus::Cancelled, InvoiceStatus::Refunded], true)) {
            throw ValidationException::withMessages([
                'status' => ['This invoice cannot be cancelled.'],
            ]);
        }

        $invoice->update([
            'status' => InvoiceStatus::Cancelled,
            'cancelled_at' => now(),
            'balance_due_cents' => 0,
        ]);

        return $this->find($tenantId, $invoice->id);
    }

    /** @return array<string, mixed> */
    public function formatInvoice(TenantInvoice $invoice): array
    {
        $status = $this->displayStatus($invoice);

        return [
            'id' => $invoice->id,
            'uuid' => $invoice->uuid,
            'invoice_number' => $invoice->invoice_number,
            'status' => $status->value,
            'subtotal_cents' => (int) $invoice->subtotal_cents,
            'discount_total_cents' => (int) $invoice->discount_total_cents,
            'tax_total_cents' => (int) $invoice->tax_total_cents,
            'total_cents' => (int) $invoice->total_cents,
            'amount_paid_cents' => (int) $invoice->amount_paid_cents,
            'balance_due_cents' => (int) $invoice->balance_due_cents,
            'currency' => $invoice->currency,
            'due_date' => $invoice->due_date?->toDateString(),
            'notes' => $invoice->notes,
            'terms' => $invoice->terms,
            'sent_at' => $invoice->sent_at?->toIso8601String(),
            'paid_at' => $invoice->paid_at?->toIso8601String(),
            'cancelled_at' => $invoice->cancelled_at?->toIso8601String(),
            'created_at' => $invoice->created_at?->toIso8601String(),
            'customer' => $invoice->customer ? [
                'id' => $invoice->customer->id,
                'name' => $invoice->customer->name,
                'email' => $invoice->customer->email,
                'phone' => $invoice->customer->phone,
            ] : null,
            'branch' => $invoice->branch ? [
                'id' => $invoice->branch->id,
                'name' => $invoice->branch->name,
            ] : null,
            'booking' => $invoice->booking ? [
                'id' => $invoice->booking->id,
                'uuid' => $invoice->booking->uuid,
            ] : null,
            'pos_sale' => $invoice->posSale ? [
                'id' => $invoice->posSale->id,
                'uuid' => $invoice->posSale->uuid,
                'sale_number' => $invoice->posSale->sale_number,
            ] : null,
            'items' => $invoice->relationLoaded('items')
                ? $invoice->items->map(fn (TenantInvoiceItem $item) => [
                    'id' => $item->id,
                    'description' => $item->description,
                    'quantity' => (int) $item->quantity,
                    'unit_price_cents' => (int) $item->unit_price_cents,
                    'line_total_cents' => (int) $item->line_total_cents,
                ])->values()->all()
                : [],
            'payments' => $invoice->relationLoaded('payments')
                ? $invoice->payments->map(fn (TenantInvoicePayment $payment) => [
                    'id' => $payment->id,
                    'payment_method' => $payment->payment_method,
                    'amount_cents' => (int) $payment->amount_cents,
                    'reference' => $payment->reference,
                    'paid_at' => $payment->paid_at?->toIso8601String(),
                    'notes' => $payment->notes,
                    'recorded_by' => $payment->recordedBy ? ['id' => $payment->recordedBy->id, 'name' => $payment->recordedBy->name] : null,
                    'payment_request' => $payment->paymentRequest ? [
                        'id' => $payment->paymentRequest->id,
                        'reference' => $payment->paymentRequest->reference,
                        'status' => $payment->paymentRequest->status->value ?? $payment->paymentRequest->status,
                    ] : null,
                ])->values()->all()
                : [],
            'payment_requests' => $invoice->relationLoaded('paymentRequests')
                ? $invoice->paymentRequests->map(fn (PaymentRequest $pr) => [
                    'id' => $pr->id,
                    'reference' => $pr->reference,
                    'status' => $pr->status->value ?? $pr->status,
                    'amount_cents' => (int) $pr->amount_cents,
                    'gateway' => $pr->gateway,
                    'created_at' => $pr->created_at?->toIso8601String(),
                ])->values()->all()
                : [],
        ];
    }

    /** @return array<string, int> */
    public function summary(int $tenantId, array $filters = []): array
    {
        $query = $this->baseQuery($tenantId);
        $this->applyFilters($query, $filters);

        $rows = (clone $query)->get();

        return [
            'total_count' => $rows->count(),
            'outstanding_cents' => (int) $rows->sum(fn (TenantInvoice $i) => in_array($this->displayStatus($i), [InvoiceStatus::Sent, InvoiceStatus::PartiallyPaid, InvoiceStatus::Overdue], true) ? $i->balance_due_cents : 0),
            'paid_count' => $rows->filter(fn (TenantInvoice $i) => $this->displayStatus($i) === InvoiceStatus::Paid)->count(),
            'overdue_count' => $rows->filter(fn (TenantInvoice $i) => $this->displayStatus($i) === InvoiceStatus::Overdue)->count(),
            'draft_count' => $rows->filter(fn (TenantInvoice $i) => $this->displayStatus($i) === InvoiceStatus::Draft)->count(),
        ];
    }

    public function outstandingBalance(int $tenantId): int
    {
        return (int) TenantInvoice::query()
            ->where('tenant_id', $tenantId)
            ->whereIn('status', [
                InvoiceStatus::Sent->value,
                InvoiceStatus::PartiallyPaid->value,
                InvoiceStatus::Overdue->value,
            ])
            ->sum('balance_due_cents');
    }

    private function baseQuery(int $tenantId): Builder
    {
        return TenantInvoice::query()->where('tenant_id', $tenantId);
    }

    /** @param  Builder<TenantInvoice>  $query */
    /** @param  array<string, mixed>  $filters */
    private function applyFilters(Builder $query, array $filters): void
    {
        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (! empty($filters['customer_id'])) {
            $query->where('customer_id', (int) $filters['customer_id']);
        }

        if (! empty($filters['from'])) {
            $query->whereDate('created_at', '>=', Carbon::parse($filters['from'])->toDateString());
        }

        if (! empty($filters['to'])) {
            $query->whereDate('created_at', '<=', Carbon::parse($filters['to'])->toDateString());
        }

        if (! empty($filters['q'])) {
            $q = trim((string) $filters['q']);
            $query->where(function (Builder $inner) use ($q) {
                $inner->where('invoice_number', 'ilike', "%{$q}%")
                    ->orWhereHas('customer', fn (Builder $c) => $c->where('name', 'ilike', "%{$q}%"));
            });
        }
    }

    /** @param  list<array{description: string, quantity?: int, unit_price_cents: int}>  $items */
    private function syncItems(TenantInvoice $invoice, array $items): void
    {
        $invoice->items()->delete();

        foreach (array_values($items) as $index => $item) {
            $qty = max(1, (int) ($item['quantity'] ?? 1));
            $unit = max(0, (int) $item['unit_price_cents']);
            $invoice->items()->create([
                'description' => $item['description'],
                'quantity' => $qty,
                'unit_price_cents' => $unit,
                'line_total_cents' => $qty * $unit,
                'sort_order' => $index,
            ]);
        }
    }

    private function recalculate(TenantInvoice $invoice): void
    {
        $invoice->loadMissing(['items', 'payments']);

        $subtotal = (int) $invoice->items->sum('line_total_cents');
        $total = max(0, $subtotal - (int) $invoice->discount_total_cents + (int) $invoice->tax_total_cents);
        $amountPaid = (int) $invoice->payments->sum('amount_cents');
        $balanceDue = max(0, $total - $amountPaid);

        $status = $invoice->status;
        if (! in_array($status, [InvoiceStatus::Draft, InvoiceStatus::Cancelled, InvoiceStatus::Refunded], true)) {
            if ($amountPaid >= $total && $total > 0) {
                $status = InvoiceStatus::Paid;
            } elseif ($amountPaid > 0) {
                $status = InvoiceStatus::PartiallyPaid;
            } elseif ($status === InvoiceStatus::Sent && $invoice->due_date?->isPast()) {
                $status = InvoiceStatus::Overdue;
            }
        }

        $invoice->update([
            'subtotal_cents' => $subtotal,
            'total_cents' => $total,
            'amount_paid_cents' => $amountPaid,
            'balance_due_cents' => $status === InvoiceStatus::Cancelled ? 0 : $balanceDue,
            'status' => $status,
            'paid_at' => $status === InvoiceStatus::Paid ? ($invoice->paid_at ?? now()) : null,
        ]);
    }

    private function displayStatus(TenantInvoice $invoice): InvoiceStatus
    {
        $status = $invoice->status instanceof InvoiceStatus ? $invoice->status : InvoiceStatus::from((string) $invoice->status);

        if (in_array($status, [InvoiceStatus::Sent, InvoiceStatus::PartiallyPaid], true)
            && $invoice->balance_due_cents > 0
            && $invoice->due_date?->isPast()) {
            return InvoiceStatus::Overdue;
        }

        return $status;
    }

    private function nextInvoiceNumber(int $tenantId): string
    {
        $year = now()->format('Y');
        $count = TenantInvoice::query()
            ->where('tenant_id', $tenantId)
            ->whereYear('created_at', $year)
            ->count() + 1;

        return sprintf('INV-%s-%04d', $year, $count);
    }
}
