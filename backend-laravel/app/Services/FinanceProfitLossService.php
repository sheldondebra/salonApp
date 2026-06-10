<?php

namespace App\Services;

use App\Enums\SaleItemType;
use App\Enums\SaleStatus;
use App\Models\PaymentTransaction;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Support\ReportFilters;
use Carbon\Carbon;

class FinanceProfitLossService
{
    public function __construct(
        private readonly TenantExpenseService $expenses,
        private readonly FinancePayrollService $payroll,
        private readonly TenantFinanceRefundService $refunds,
        private readonly TenantWalletService $wallets,
    ) {}

    /** @return array<string, mixed> */
    public function statement(ReportFilters $filters): array
    {
        $tenantId = (int) $filters->tenantId;
        $from = $filters->from;
        $to = $filters->to;
        $locationId = $filters->locationId;

        $grossRevenueCents = $this->grossRevenue($tenantId, $from, $to, $locationId);
        $discountsCents = $this->discounts($tenantId, $from, $to, $locationId);
        $netRevenueCents = max(0, $grossRevenueCents - $discountsCents);
        $cogsCents = $this->costOfGoodsSold($tenantId, $from, $to, $locationId);
        $grossProfitCents = max(0, $netRevenueCents - $cogsCents);

        $operatingExpensesCents = $this->expenses->sumInRange($tenantId, $from, $to, $locationId);
        $payrollCents = $this->payroll->summary($tenantId, [
            'from' => $from->toDateString(),
            'to' => $to->toDateString(),
            'location_id' => $locationId,
        ], null)['summary']['total_payroll_cents'] ?? 0;
        $platformFeesCents = (int) ($this->wallets->walletFor($tenantId)->total_fees ?? 0);
        $refundsCents = $this->refunds->sumInRange($tenantId, $from, $to);

        $totalExpensesCents = $operatingExpensesCents + (int) $payrollCents + $platformFeesCents + $refundsCents;
        $netProfitCents = $grossProfitCents - $totalExpensesCents;
        $marginPercent = $netRevenueCents > 0
            ? round(($netProfitCents / $netRevenueCents) * 100, 2)
            : 0.0;

        $sections = [
            ['key' => 'gross_revenue', 'label' => 'Gross revenue', 'section' => 'income', 'amount_cents' => $grossRevenueCents],
            ['key' => 'discounts', 'label' => 'Discounts', 'section' => 'income', 'amount_cents' => -$discountsCents],
            ['key' => 'net_revenue', 'label' => 'Net revenue', 'section' => 'income', 'amount_cents' => $netRevenueCents, 'emphasis' => true],
            ['key' => 'cogs', 'label' => 'Cost of goods sold', 'section' => 'cogs', 'amount_cents' => -$cogsCents],
            ['key' => 'gross_profit', 'label' => 'Gross profit', 'section' => 'summary', 'amount_cents' => $grossProfitCents, 'emphasis' => true],
            ['key' => 'operating_expenses', 'label' => 'Operating expenses', 'section' => 'expenses', 'amount_cents' => -$operatingExpensesCents],
            ['key' => 'payroll', 'label' => 'Payroll & staff earnings', 'section' => 'expenses', 'amount_cents' => -(int) $payrollCents],
            ['key' => 'platform_fees', 'label' => 'Platform & gateway fees', 'section' => 'expenses', 'amount_cents' => -$platformFeesCents],
            ['key' => 'refunds', 'label' => 'Refunds', 'section' => 'expenses', 'amount_cents' => -$refundsCents],
            ['key' => 'total_expenses', 'label' => 'Total expenses', 'section' => 'expenses', 'amount_cents' => -$totalExpensesCents, 'emphasis' => true],
            ['key' => 'net_profit', 'label' => 'Estimated net profit', 'section' => 'summary', 'amount_cents' => $netProfitCents, 'emphasis' => true],
        ];

        return [
            'filters' => $filters->toArray(),
            'summary' => [
                'gross_revenue_cents' => $grossRevenueCents,
                'discounts_cents' => $discountsCents,
                'net_revenue_cents' => $netRevenueCents,
                'cogs_cents' => $cogsCents,
                'gross_profit_cents' => $grossProfitCents,
                'operating_expenses_cents' => $operatingExpensesCents,
                'payroll_cents' => (int) $payrollCents,
                'platform_fees_cents' => $platformFeesCents,
                'refunds_cents' => $refundsCents,
                'total_expenses_cents' => $totalExpensesCents,
                'net_profit_cents' => $netProfitCents,
                'margin_percent' => $marginPercent,
            ],
            'sections' => $sections,
            'monthly_trend' => $this->monthlyTrend($tenantId, $from, $to, $locationId),
        ];
    }

    /** @return list<array<string, mixed>> */
    public function exportRows(ReportFilters $filters): array
    {
        $payload = $this->statement($filters);

        return collect($payload['sections'])->map(fn (array $row) => [
            'section' => $row['section'],
            'label' => $row['label'],
            'amount_cents' => $row['amount_cents'],
            'period_from' => $payload['filters']['from'] ?? null,
            'period_to' => $payload['filters']['to'] ?? null,
        ])->values()->all();
    }

    protected function grossRevenue(int $tenantId, Carbon $from, Carbon $to, ?int $locationId): int
    {
        $paid = (int) PaymentTransaction::query()
            ->withoutGlobalScope('tenant')
            ->where('tenant_id', $tenantId)
            ->where('status', 'paid')
            ->whereBetween('paid_at', [$from, $to])
            ->when($locationId, function ($q) use ($locationId) {
                $q->where(function ($inner) use ($locationId) {
                    $inner->whereHas('appointment', fn ($apt) => $apt->where('location_id', $locationId))
                        ->orWhereHas('sale', fn ($sale) => $sale->where('location_id', $locationId));
                });
            })
            ->sum('amount_cents');

        $pos = (int) Sale::query()
            ->where('tenant_id', $tenantId)
            ->where('status', SaleStatus::Completed)
            ->whereBetween('completed_at', [$from, $to])
            ->when($locationId, fn ($q) => $q->where('location_id', $locationId))
            ->whereDoesntHave('payment', fn ($q) => $q->where('status', 'paid'))
            ->sum('total_cents');

        return $paid + $pos;
    }

    protected function discounts(int $tenantId, Carbon $from, Carbon $to, ?int $locationId): int
    {
        $fromPaid = (int) PaymentTransaction::query()
            ->withoutGlobalScope('tenant')
            ->where('tenant_id', $tenantId)
            ->where('status', 'paid')
            ->whereBetween('paid_at', [$from, $to])
            ->sum('discount_cents');

        $fromPos = (int) Sale::query()
            ->where('tenant_id', $tenantId)
            ->where('status', SaleStatus::Completed)
            ->whereBetween('completed_at', [$from, $to])
            ->when($locationId, fn ($q) => $q->where('location_id', $locationId))
            ->sum('discount_cents');

        return $fromPaid + $fromPos;
    }

    protected function costOfGoodsSold(int $tenantId, Carbon $from, Carbon $to, ?int $locationId): int
    {
        $items = SaleItem::query()
            ->where('tenant_id', $tenantId)
            ->where('item_type', SaleItemType::Product)
            ->whereHas('sale', function ($q) use ($tenantId, $from, $to, $locationId) {
                $q->where('tenant_id', $tenantId)
                    ->where('status', SaleStatus::Completed)
                    ->whereBetween('completed_at', [$from, $to])
                    ->when($locationId, fn ($inner) => $inner->where('location_id', $locationId));
            })
            ->with('product:id,cost_cents')
            ->get(['id', 'product_id', 'quantity']);

        return (int) $items->sum(function (SaleItem $item) {
            $cost = (int) ($item->product?->cost_cents ?? 0);

            return max(0, $item->quantity) * $cost;
        });
    }

    /**
     * @return list<array{month: string, label: string, revenue_cents: int, expenses_cents: int, profit_cents: int}>
     */
    protected function monthlyTrend(int $tenantId, Carbon $from, Carbon $to, ?int $locationId): array
    {
        $points = [];
        $cursor = $from->copy()->startOfMonth();
        $end = $to->copy()->startOfMonth();

        while ($cursor->lte($end)) {
            $monthStart = $cursor->copy()->startOfMonth();
            $monthEnd = $cursor->copy()->endOfMonth();
            $rangeFrom = $monthStart->lt($from) ? $from->copy() : $monthStart;
            $rangeTo = $monthEnd->gt($to) ? $to->copy() : $monthEnd;

            $revenue = $this->grossRevenue($tenantId, $rangeFrom, $rangeTo, $locationId);
            $discounts = $this->discounts($tenantId, $rangeFrom, $rangeTo, $locationId);
            $netRevenue = max(0, $revenue - $discounts);
            $cogs = $this->costOfGoodsSold($tenantId, $rangeFrom, $rangeTo, $locationId);
            $expenses = $this->expenses->sumInRange($tenantId, $rangeFrom, $rangeTo, $locationId);
            $profit = $netRevenue - $cogs - $expenses;

            $points[] = [
                'month' => $cursor->format('Y-m'),
                'label' => $cursor->format('M Y'),
                'revenue_cents' => $netRevenue,
                'expenses_cents' => $cogs + $expenses,
                'profit_cents' => $profit,
            ];

            $cursor->addMonth();
        }

        return $points;
    }
}
