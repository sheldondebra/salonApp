<?php

namespace App\Services;

use App\Enums\FinanceRefundMethod;
use App\Enums\FinanceRefundSource;
use App\Enums\FinanceRefundStatus;
use App\Enums\InvoiceStatus;
use App\Enums\PaymentRequestStatus;
use App\Enums\SaleStatus;
use App\Models\PaymentRequest;
use App\Models\Sale;
use App\Models\TenantFinanceRefund;
use App\Models\TenantInvoice;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class TenantFinanceRefundService
{
    /** @param  array<string, mixed>  $filters */
    public function paginate(int $tenantId, array $filters = [], int $perPage = 20): LengthAwarePaginator
    {
        $perPage = max(1, min($perPage, 100));

        return $this->baseQuery($tenantId, $filters)
            ->with(['branch:id,name', 'refundedBy:id,name', 'sale:id,sale_number', 'paymentRequest:id,reference'])
            ->orderByDesc('refunded_at')
            ->orderByDesc('id')
            ->paginate($perPage)
            ->through(fn (TenantFinanceRefund $refund) => $this->formatRefund($refund));
    }

    /** @param  array<string, mixed>  $filters */
    public function sumInRange(int $tenantId, ?Carbon $from = null, ?Carbon $to = null): int
    {
        $query = TenantFinanceRefund::query()
            ->where('tenant_id', $tenantId)
            ->where('status', FinanceRefundStatus::Completed);

        if ($from) {
            $query->where('refunded_at', '>=', $from->copy()->startOfDay());
        }
        if ($to) {
            $query->where('refunded_at', '<=', $to->copy()->endOfDay());
        }

        return (int) $query->sum('amount_cents');
    }

    public function find(int $tenantId, int $id): TenantFinanceRefund
    {
        return TenantFinanceRefund::query()
            ->where('tenant_id', $tenantId)
            ->with(['branch:id,name', 'refundedBy:id,name'])
            ->findOrFail($id);
    }

    /** @return array{max_refundable_cents: int, currency: string, label: string|null} */
    public function refundableSummary(int $tenantId, string $sourceType, int $sourceId): array
    {
        $source = FinanceRefundSource::from($sourceType);
        $fields = $this->resolveSourceFields($tenantId, $source, $sourceId);
        $total = $fields['total_cents'];
        $already = $this->refundedAmount($tenantId, $source, $sourceId);

        return [
            'max_refundable_cents' => max(0, $total - $already),
            'currency' => $fields['currency'],
            'label' => $fields['label'],
        ];
    }

    /** @param  array<string, mixed>  $data */
    public function create(int $tenantId, array $data, User $user): TenantFinanceRefund
    {
        $source = FinanceRefundSource::from($data['source_type']);
        $sourceId = (int) $data['source_id'];
        $amount = (int) $data['amount_cents'];
        $method = FinanceRefundMethod::from($data['refund_method'] ?? FinanceRefundMethod::Cash->value);

        $summary = $this->refundableSummary($tenantId, $source->value, $sourceId);
        if ($amount < 1) {
            throw ValidationException::withMessages(['amount_cents' => ['Refund amount must be at least 1.']]);
        }
        if ($amount > $summary['max_refundable_cents']) {
            throw ValidationException::withMessages([
                'amount_cents' => ['Refund exceeds the remaining refundable amount.'],
            ]);
        }

        [$total, $currency, $label, $branchId, $saleId, $paymentRequestId, $invoiceId] = (function () use ($tenantId, $source, $sourceId) {
            $fields = $this->resolveSourceFields($tenantId, $source, $sourceId);

            return [
                $fields['total_cents'],
                $fields['currency'],
                $fields['label'],
                $fields['branch_id'],
                $fields['sale_id'],
                $fields['payment_request_id'],
                $fields['invoice_id'],
            ];
        })();

        $status = $method === FinanceRefundMethod::Gateway
            ? FinanceRefundStatus::PendingGateway
            : FinanceRefundStatus::Completed;

        return DB::transaction(function () use (
            $tenantId,
            $data,
            $user,
            $source,
            $sourceId,
            $amount,
            $method,
            $status,
            $currency,
            $branchId,
            $saleId,
            $paymentRequestId,
            $invoiceId,
            $label,
            $total
        ) {
            $refund = TenantFinanceRefund::query()->create([
                'tenant_id' => $tenantId,
                'branch_id' => $branchId,
                'source_type' => $source,
                'source_id' => $sourceId,
                'sale_id' => $saleId,
                'payment_request_id' => $paymentRequestId,
                'tenant_invoice_id' => $invoiceId,
                'amount_cents' => $amount,
                'currency' => $currency,
                'refund_method' => $method,
                'reason' => $data['reason'],
                'status' => $status,
                'gateway_reference' => $data['gateway_reference'] ?? null,
                'notes' => $data['notes'] ?? null,
                'refunded_by_user_id' => $user->id,
                'refunded_at' => $status === FinanceRefundStatus::Completed ? now() : null,
                'metadata' => [
                    'audit' => [
                        'action' => 'finance_refund_created',
                        'source_label' => $label,
                        'source_total_cents' => $total,
                        'created_by' => $user->only(['id', 'name', 'email']),
                        'created_at' => now()->toIso8601String(),
                        'gateway_placeholder' => $method === FinanceRefundMethod::Gateway,
                    ],
                ],
            ]);

            return $this->formatRefund($refund->fresh(['branch', 'refundedBy', 'sale', 'paymentRequest']));
        });
    }

    /** @return array<string, mixed> */
    public function formatRefund(TenantFinanceRefund $refund): array
    {
        return [
            'id' => $refund->id,
            'source_type' => $refund->source_type->value,
            'source_id' => $refund->source_id,
            'amount_cents' => (int) $refund->amount_cents,
            'currency' => $refund->currency,
            'refund_method' => $refund->refund_method->value,
            'reason' => $refund->reason,
            'status' => $refund->status->value,
            'gateway_reference' => $refund->gateway_reference,
            'notes' => $refund->notes,
            'refunded_at' => $refund->refunded_at?->toIso8601String(),
            'branch' => $refund->branch ? ['id' => $refund->branch->id, 'name' => $refund->branch->name] : null,
            'refunded_by' => $refund->refundedBy ? ['id' => $refund->refundedBy->id, 'name' => $refund->refundedBy->name] : null,
            'sale_number' => $refund->sale?->sale_number,
            'payment_reference' => $refund->paymentRequest?->reference,
        ];
    }

    /** @return list<array<string, mixed>> */
    public function ledgerRows(int $tenantId, Carbon $from, Carbon $to): array
    {
        return TenantFinanceRefund::query()
            ->where('tenant_id', $tenantId)
            ->where('status', FinanceRefundStatus::Completed)
            ->whereBetween('refunded_at', [$from, $to])
            ->with(['branch:id,name', 'sale:id,sale_number', 'paymentRequest:id,reference,customer_id', 'paymentRequest.customer:id,name'])
            ->orderByDesc('refunded_at')
            ->get()
            ->map(function (TenantFinanceRefund $refund) {
                $customerName = $refund->paymentRequest?->customer?->name;

                return [
                    'id' => 'finance_refund:'.$refund->id,
                    'source_type' => $refund->source_type->value,
                    'source_id' => $refund->source_id,
                    'transaction_type' => 'refund',
                    'status' => 'posted',
                    'amount_cents' => (int) $refund->amount_cents,
                    'currency' => $refund->currency,
                    'payment_method' => $refund->refund_method->value,
                    'reference' => $refund->sale?->sale_number ?? $refund->paymentRequest?->reference ?? ('REF-'.$refund->id),
                    'description' => 'Refund · '.str_replace('_', ' ', $refund->reason),
                    'customer_name' => $customerName,
                    'branch_name' => $refund->branch?->name,
                    'occurred_at' => $refund->refunded_at?->toIso8601String(),
                ];
            })
            ->values()
            ->all();
    }

    private function refundedAmount(int $tenantId, FinanceRefundSource $source, int $sourceId): int
    {
        return (int) TenantFinanceRefund::query()
            ->where('tenant_id', $tenantId)
            ->where('source_type', $source)
            ->where('source_id', $sourceId)
            ->whereIn('status', [FinanceRefundStatus::Completed, FinanceRefundStatus::PendingGateway])
            ->sum('amount_cents');
    }

    /** @return array{total_cents: int, currency: string, label: string|null, branch_id: int|null, sale_id: int|null, payment_request_id: int|null, invoice_id: int|null} */
    private function resolveSourceFields(int $tenantId, FinanceRefundSource $source, int $sourceId): array
    {
        return match ($source) {
            FinanceRefundSource::PosSale => $this->resolvePosSale($tenantId, $sourceId),
            FinanceRefundSource::PaymentRequest => $this->resolvePaymentRequest($tenantId, $sourceId),
            FinanceRefundSource::Invoice => $this->resolveInvoice($tenantId, $sourceId),
        };
    }

    /** @return array{total_cents: int, currency: string, label: string|null, branch_id: int|null, sale_id: int|null, payment_request_id: int|null, invoice_id: int|null} */
    private function resolvePosSale(int $tenantId, int $saleId): array
    {
        $sale = Sale::query()
            ->where('tenant_id', $tenantId)
            ->where('status', SaleStatus::Completed)
            ->findOrFail($saleId);

        return [
            'total_cents' => (int) $sale->total_cents,
            'currency' => $sale->currency,
            'label' => $sale->sale_number ? "POS {$sale->sale_number}" : "POS #{$sale->id}",
            'branch_id' => $sale->location_id,
            'sale_id' => $sale->id,
            'payment_request_id' => null,
            'invoice_id' => null,
        ];
    }

    /** @return array{total_cents: int, currency: string, label: string|null, branch_id: int|null, sale_id: int|null, payment_request_id: int|null, invoice_id: int|null} */
    private function resolvePaymentRequest(int $tenantId, int $paymentRequestId): array
    {
        $request = PaymentRequest::query()
            ->where('tenant_id', $tenantId)
            ->where('status', PaymentRequestStatus::Success)
            ->findOrFail($paymentRequestId);

        return [
            'total_cents' => (int) $request->amount_cents,
            'currency' => $request->currency,
            'label' => $request->reference,
            'branch_id' => $request->branch_id,
            'sale_id' => $request->pos_sale_id,
            'payment_request_id' => $request->id,
            'invoice_id' => $request->invoice_id,
        ];
    }

    /** @return array{total_cents: int, currency: string, label: string|null, branch_id: int|null, sale_id: int|null, payment_request_id: int|null, invoice_id: int|null} */
    private function resolveInvoice(int $tenantId, int $invoiceId): array
    {
        $invoice = TenantInvoice::query()
            ->where('tenant_id', $tenantId)
            ->whereIn('status', [InvoiceStatus::Paid, InvoiceStatus::PartiallyPaid])
            ->findOrFail($invoiceId);

        $paid = (int) $invoice->total_cents - (int) $invoice->balance_due_cents;

        return [
            'total_cents' => $paid,
            'currency' => $invoice->currency,
            'label' => $invoice->invoice_number,
            'branch_id' => $invoice->branch_id,
            'sale_id' => null,
            'payment_request_id' => null,
            'invoice_id' => $invoice->id,
        ];
    }

    /** @param  array<string, mixed>  $filters */
    private function baseQuery(int $tenantId, array $filters): Builder
    {
        $query = TenantFinanceRefund::query()->where('tenant_id', $tenantId);

        if (! empty($filters['from'])) {
            $query->whereDate('refunded_at', '>=', $filters['from']);
        }
        if (! empty($filters['to'])) {
            $query->whereDate('refunded_at', '<=', $filters['to']);
        }
        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }
        if (! empty($filters['source_type'])) {
            $query->where('source_type', $filters['source_type']);
        }

        return $query;
    }
}
