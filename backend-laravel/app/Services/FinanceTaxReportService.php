<?php

namespace App\Services;

use App\Enums\InvoiceStatus;
use App\Enums\SaleStatus;
use App\Models\Sale;
use App\Models\TenantInvoice;
use Carbon\Carbon;

class FinanceTaxReportService
{
    /**
     * @param  array<string, mixed>  $filters
     * @return array<string, mixed>
     */
    public function report(int $tenantId, array $filters = []): array
    {
        $from = isset($filters['from'])
            ? Carbon::parse((string) $filters['from'])->startOfDay()
            : now()->startOfMonth();
        $to = isset($filters['to'])
            ? Carbon::parse((string) $filters['to'])->endOfDay()
            : now()->endOfDay();
        $locationId = ! empty($filters['location_id']) ? (int) $filters['location_id'] : null;

        $posTax = $this->posTaxQuery($tenantId, $from, $to, $locationId);
        $invoiceTax = $this->invoiceTaxQuery($tenantId, $from, $to, $locationId);

        $posTaxCents = (int) (clone $posTax)->sum('tax_cents');
        $posTaxableCents = (int) (clone $posTax)->sum('subtotal_cents');
        $posCount = (int) (clone $posTax)->count();

        $invoiceTaxCents = (int) (clone $invoiceTax)->sum('tax_total_cents');
        $invoiceTaxableCents = (int) (clone $invoiceTax)->sum('subtotal_cents');
        $invoiceCount = (int) (clone $invoiceTax)->count();

        $totalTaxCents = $posTaxCents + $invoiceTaxCents;
        $taxableSalesCents = $posTaxableCents + $invoiceTaxableCents;

        return [
            'filters' => [
                'from' => $from->toDateString(),
                'to' => $to->toDateString(),
                'location_id' => $locationId,
            ],
            'summary' => [
                'tax_collected_cents' => $totalTaxCents,
                'taxable_sales_cents' => $taxableSalesCents,
                'pos_tax_cents' => $posTaxCents,
                'invoice_tax_cents' => $invoiceTaxCents,
                'pos_sale_count' => $posCount,
                'invoice_count' => $invoiceCount,
            ],
            'by_source' => [
                [
                    'source' => 'pos',
                    'label' => 'Point of sale',
                    'tax_cents' => $posTaxCents,
                    'taxable_cents' => $posTaxableCents,
                    'count' => $posCount,
                ],
                [
                    'source' => 'invoice',
                    'label' => 'Invoices',
                    'tax_cents' => $invoiceTaxCents,
                    'taxable_cents' => $invoiceTaxableCents,
                    'count' => $invoiceCount,
                ],
            ],
            'monthly_trend' => $this->monthlyTrend($tenantId, $from, $to, $locationId),
        ];
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return list<array<string, mixed>>
     */
    public function exportRows(int $tenantId, array $filters = []): array
    {
        $payload = $this->report($tenantId, $filters);

        return collect($payload['by_source'])->map(fn (array $row) => [
            'source' => $row['source'],
            'label' => $row['label'],
            'tax_cents' => $row['tax_cents'],
            'taxable_cents' => $row['taxable_cents'],
            'count' => $row['count'],
            'period_from' => $payload['filters']['from'],
            'period_to' => $payload['filters']['to'],
        ])->values()->all();
    }

    protected function posTaxQuery(int $tenantId, Carbon $from, Carbon $to, ?int $locationId)
    {
        return Sale::query()
            ->where('tenant_id', $tenantId)
            ->where('status', SaleStatus::Completed)
            ->where('tax_cents', '>', 0)
            ->whereBetween('completed_at', [$from, $to])
            ->when($locationId, fn ($q) => $q->where('location_id', $locationId));
    }

    protected function invoiceTaxQuery(int $tenantId, Carbon $from, Carbon $to, ?int $locationId)
    {
        return TenantInvoice::query()
            ->where('tenant_id', $tenantId)
            ->whereIn('status', [
                InvoiceStatus::Sent->value,
                InvoiceStatus::PartiallyPaid->value,
                InvoiceStatus::Paid->value,
            ])
            ->where('tax_total_cents', '>', 0)
            ->where(function ($q) use ($from, $to) {
                $q->whereBetween('sent_at', [$from, $to])
                    ->orWhere(function ($inner) use ($from, $to) {
                        $inner->whereNull('sent_at')->whereBetween('created_at', [$from, $to]);
                    });
            })
            ->when($locationId, fn ($q) => $q->where('branch_id', $locationId));
    }

    /**
     * @return list<array{month: string, label: string, tax_cents: int}>
     */
    protected function monthlyTrend(int $tenantId, Carbon $from, Carbon $to, ?int $locationId): array
    {
        $posSales = Sale::query()
            ->where('tenant_id', $tenantId)
            ->where('status', SaleStatus::Completed)
            ->where('tax_cents', '>', 0)
            ->whereBetween('completed_at', [$from, $to])
            ->when($locationId, fn ($q) => $q->where('location_id', $locationId))
            ->get(['tax_cents', 'completed_at']);

        $invoices = TenantInvoice::query()
            ->where('tenant_id', $tenantId)
            ->where('tax_total_cents', '>', 0)
            ->where(function ($q) use ($from, $to) {
                $q->whereBetween('sent_at', [$from, $to])
                    ->orWhere(function ($inner) use ($from, $to) {
                        $inner->whereNull('sent_at')->whereBetween('created_at', [$from, $to]);
                    });
            })
            ->when($locationId, fn ($q) => $q->where('branch_id', $locationId))
            ->get(['tax_total_cents', 'sent_at', 'created_at']);

        $byMonth = [];

        foreach ($posSales as $sale) {
            $key = $sale->completed_at?->format('Y-m') ?? 'unknown';
            $byMonth[$key] = ($byMonth[$key] ?? 0) + (int) $sale->tax_cents;
        }

        foreach ($invoices as $invoice) {
            $date = $invoice->sent_at ?? $invoice->created_at;
            $key = $date?->format('Y-m') ?? 'unknown';
            $byMonth[$key] = ($byMonth[$key] ?? 0) + (int) $invoice->tax_total_cents;
        }

        $cursor = $from->copy()->startOfMonth();
        $end = $to->copy()->startOfMonth();
        $points = [];

        while ($cursor->lte($end)) {
            $key = $cursor->format('Y-m');
            $points[] = [
                'month' => $key,
                'label' => $cursor->format('M Y'),
                'tax_cents' => (int) ($byMonth[$key] ?? 0),
            ];
            $cursor->addMonth();
        }

        return $points;
    }
}
