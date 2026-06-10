<?php

namespace App\Services;

use App\Enums\PaymentRequestStatus;
use App\Models\PaymentRequest;
use App\Models\PaymentTransaction;
use App\Models\Sale;
use App\Models\StaffPayrollProfile;
use App\Support\ReportFilters;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class FinanceOverviewService
{
    public function __construct(
        private readonly ReportsService $reports,
        private readonly TenantWalletService $wallets,
        private readonly TenantInvoiceService $invoices,
        private readonly TenantExpenseService $expenses,
        private readonly TenantFinanceRefundService $refunds,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function overview(ReportFilters $filters): array
    {
        $tenantId = $filters->tenantId;
        if (! $tenantId) {
            return [];
        }

        $today = Carbon::today();
        $startOfMonth = Carbon::now()->startOfMonth();
        $days = $this->dateSeries($filters->from, $filters->to);

        $paidTransactions = $this->paidTransactionQuery($filters);
        $completedSales = $this->completedSaleQuery($filters);

        $grossInRange = $this->sumCollectedRevenue($filters);
        $tipsInRange = (int) (clone $completedSales)->sum('tip_cents');
        $discountsInRange = $this->sumDiscounts($filters);
        $refundsInRange = $this->refunds->sumInRange($tenantId, $filters->from, $filters->to);

        $expensesCents = $this->expenses->sumInRange($tenantId, $filters->from, $filters->to, $filters->locationId);
        $outstandingInvoicesCents = $this->invoices->outstandingBalance($tenantId);
        $payrollDueCents = $this->estimatePayrollDue($tenantId);
        $platformFeesCents = (int) ($this->wallets->walletFor($tenantId)->total_fees ?? 0);

        $netInRange = max(0, $grossInRange - $discountsInRange - $platformFeesCents - $expensesCents - $payrollDueCents);

        $paymentRequestBase = PaymentRequest::query()
            ->where('tenant_id', $tenantId)
            ->when($filters->locationId, fn ($q) => $q->where('branch_id', $filters->locationId));

        $pendingRequests = (clone $paymentRequestBase)
            ->whereIn('status', [
                PaymentRequestStatus::Pending->value,
                PaymentRequestStatus::Processing->value,
            ]);

        $failedRequests = (clone $paymentRequestBase)
            ->where('status', PaymentRequestStatus::Failed->value);

        $pendingTransactions = PaymentTransaction::query()
            ->withoutGlobalScope('tenant')
            ->where('tenant_id', $tenantId)
            ->where('status', 'pending')
            ->when($filters->locationId || $filters->staffMemberId || $filters->serviceId, function ($q) use ($filters) {
                $q->where(function ($inner) use ($filters) {
                    $inner->whereHas('appointment', function ($apt) use ($filters) {
                        if ($filters->locationId) {
                            $apt->where('location_id', $filters->locationId);
                        }
                        if ($filters->staffMemberId) {
                            $apt->where('staff_member_id', $filters->staffMemberId);
                        }
                        if ($filters->serviceId) {
                            $apt->where('service_id', $filters->serviceId);
                        }
                    })->orWhereHas('sale', function ($sale) use ($filters) {
                        if ($filters->locationId) {
                            $sale->where('location_id', $filters->locationId);
                        }
                    });
                });
            });

        $failedTransactions = PaymentTransaction::query()
            ->withoutGlobalScope('tenant')
            ->where('tenant_id', $tenantId)
            ->where('status', 'failed');

        $wallet = $this->wallets->walletFor($tenantId);
        $tenantReport = $this->reports->tenantReport($filters);

        $revenueTrend = $this->mergeRevenueTrend(
            $tenantReport['revenue'] ?? [],
            $this->posRevenueSeries($filters, $days)
        );

        $daysCount = max(1, count($revenueTrend));
        $dailyExpense = (int) round(($expensesCents + $payrollDueCents + $platformFeesCents) / $daysCount);

        $profitEstimate = collect($revenueTrend)->map(function (array $point) use ($dailyExpense) {
            return [
                'date' => $point['date'],
                'label' => $point['label'],
                'income_cents' => (int) ($point['revenue_cents'] ?? 0),
                'expenses_cents' => $dailyExpense,
                'profit_cents' => max(0, (int) ($point['revenue_cents'] ?? 0) - $dailyExpense),
            ];
        })->values()->all();

        return [
            'filters' => $filters->toArray(),
            'cards' => [
                'revenue_today_cents' => $this->revenueForDay($tenantId, $today, $filters->locationId),
                'revenue_month_cents' => $this->revenueSince($tenantId, $startOfMonth, $filters->locationId),
                'gross_revenue_cents' => $grossInRange,
                'net_revenue_cents' => $netInRange,
                'outstanding_invoices_cents' => $outstandingInvoicesCents,
                'expenses_cents' => $expensesCents,
                'payroll_due_cents' => $payrollDueCents,
                'tips_collected_cents' => $tipsInRange,
                'refunds_cents' => $refundsInRange,
                'discounts_cents' => $discountsInRange,
                'total_payments_cents' => (int) (clone $paidTransactions)->sum('amount_cents')
                    + (int) (clone $completedSales)->whereDoesntHave('payment', fn ($q) => $q->where('status', 'paid'))->sum('total_cents'),
                'pending_payments_cents' => (int) (clone $pendingRequests)->sum('amount_cents')
                    + (int) (clone $pendingTransactions)->sum('amount_cents'),
                'pending_payments_count' => (clone $pendingRequests)->count() + (clone $pendingTransactions)->count(),
                'failed_payments_cents' => (int) (clone $failedRequests)->sum('amount_cents')
                    + (int) (clone $failedTransactions)->sum('amount_cents'),
                'failed_payments_count' => (clone $failedRequests)->count() + (clone $failedTransactions)->count(),
                'platform_fees_cents' => $platformFeesCents,
                'wallet_available_cents' => (int) $wallet->available_balance,
                'wallet_pending_cents' => (int) $wallet->pending_balance,
            ],
            'charts' => [
                'revenue_trend' => $revenueTrend,
                'payment_methods' => $this->paymentMethodBreakdown($filters),
                'service_revenue' => array_slice($tenantReport['popular_services'] ?? [], 0, 8),
                'staff_revenue' => array_slice($tenantReport['staff_performance'] ?? [], 0, 8),
                'expenses_trend' => collect($this->expenses->monthlyTrend($tenantId, count($days)))->map(fn (array $point) => [
                    'date' => $point['month'].'-01',
                    'label' => $point['label'],
                    'expenses_cents' => $point['amount_cents'],
                ])->values()->all(),
                'profit_estimate' => $profitEstimate,
            ],
            'recent_payments' => $this->recentPayments($tenantId, $filters->locationId),
            'filter_options' => $tenantReport['filter_options'] ?? [],
        ];
    }

    protected function paidTransactionQuery(ReportFilters $filters)
    {
        return PaymentTransaction::query()
            ->withoutGlobalScope('tenant')
            ->where('tenant_id', $filters->tenantId)
            ->where('status', 'paid')
            ->whereBetween('paid_at', [$filters->from, $filters->to])
            ->when(
                $filters->locationId || $filters->staffMemberId || $filters->serviceId || $filters->status,
                function ($q) use ($filters) {
                    $q->where(function ($inner) use ($filters) {
                        $inner->whereHas('appointment', function ($apt) use ($filters) {
                            if ($filters->locationId) {
                                $apt->where('location_id', $filters->locationId);
                            }
                            if ($filters->staffMemberId) {
                                $apt->where('staff_member_id', $filters->staffMemberId);
                            }
                            if ($filters->serviceId) {
                                $apt->where('service_id', $filters->serviceId);
                            }
                            if ($filters->status) {
                                $apt->where('status', $filters->status);
                            }
                        })->orWhereHas('sale', function ($sale) use ($filters) {
                            if ($filters->locationId) {
                                $sale->where('location_id', $filters->locationId);
                            }
                        });
                    });
                }
            );
    }

    protected function completedSaleQuery(ReportFilters $filters)
    {
        return Sale::query()
            ->where('tenant_id', $filters->tenantId)
            ->where('status', 'completed')
            ->whereBetween('completed_at', [$filters->from, $filters->to])
            ->when($filters->locationId, fn ($q) => $q->where('location_id', $filters->locationId))
            ->when($filters->serviceId, function ($q) use ($filters) {
                $q->whereHas('items', fn ($item) => $item
                    ->where('item_type', 'service')
                    ->where('service_id', $filters->serviceId));
            });
    }

    protected function sumCollectedRevenue(ReportFilters $filters): int
    {
        $fromPaid = (int) $this->paidTransactionQuery($filters)->sum('amount_cents');

        $fromPos = (int) $this->completedSaleQuery($filters)
            ->whereDoesntHave('payment', fn ($q) => $q->where('status', 'paid'))
            ->sum('total_cents');

        return $fromPaid + $fromPos;
    }

    protected function sumDiscounts(ReportFilters $filters): int
    {
        $fromPaid = (int) $this->paidTransactionQuery($filters)->sum('discount_cents');
        $fromPos = (int) $this->completedSaleQuery($filters)->sum('discount_cents');

        return $fromPaid + $fromPos;
    }

    protected function walletRefunds(int $tenantId): int
    {
        return (int) ($this->wallets->walletFor($tenantId)->total_refunded ?? 0);
    }

    protected function estimatePayrollDue(int $tenantId): int
    {
        return (int) StaffPayrollProfile::query()
            ->where('tenant_id', $tenantId)
            ->whereBool('is_active', true)
            ->where('pay_type', 'salary')
            ->sum('base_salary_cents');
    }

    protected function revenueForDay(int $tenantId, Carbon $day, ?int $locationId): int
    {
        $from = $day->copy()->startOfDay();
        $to = $day->copy()->endOfDay();

        $paid = (int) PaymentTransaction::query()
            ->withoutGlobalScope('tenant')
            ->where('tenant_id', $tenantId)
            ->where('status', 'paid')
            ->whereBetween('paid_at', [$from, $to])
            ->sum('amount_cents');

        $pos = (int) Sale::query()
            ->where('tenant_id', $tenantId)
            ->where('status', 'completed')
            ->whereBetween('completed_at', [$from, $to])
            ->when($locationId, fn ($q) => $q->where('location_id', $locationId))
            ->whereDoesntHave('payment', fn ($q) => $q->where('status', 'paid'))
            ->sum('total_cents');

        return $paid + $pos;
    }

    protected function revenueSince(int $tenantId, Carbon $since, ?int $locationId): int
    {
        $paid = (int) PaymentTransaction::query()
            ->withoutGlobalScope('tenant')
            ->where('tenant_id', $tenantId)
            ->where('status', 'paid')
            ->where('paid_at', '>=', $since)
            ->sum('amount_cents');

        $pos = (int) Sale::query()
            ->where('tenant_id', $tenantId)
            ->where('status', 'completed')
            ->where('completed_at', '>=', $since)
            ->when($locationId, fn ($q) => $q->where('location_id', $locationId))
            ->whereDoesntHave('payment', fn ($q) => $q->where('status', 'paid'))
            ->sum('total_cents');

        return $paid + $pos;
    }

    /**
     * @param  list<string>  $days
     * @return list<array{date: string, label: string, revenue_cents: int}>
     */
    protected function posRevenueSeries(ReportFilters $filters, array $days): array
    {
        $rows = $this->completedSaleQuery($filters)
            ->whereDoesntHave('payment', fn ($q) => $q->where('status', 'paid'))
            ->select(
                DB::raw('DATE(completed_at) as date'),
                DB::raw('SUM(total_cents) as revenue_cents')
            )
            ->groupBy('date')
            ->pluck('revenue_cents', 'date');

        return collect($days)->map(fn (string $date) => [
            'date' => $date,
            'label' => Carbon::parse($date)->format('M j'),
            'revenue_cents' => (int) ($rows[$date] ?? 0),
        ])->values()->all();
    }

    /**
     * @param  list<array{date: string, label: string, revenue_cents: int}>  $bookingSeries
     * @param  list<array{date: string, label: string, revenue_cents: int}>  $posSeries
     * @return list<array{date: string, label: string, revenue_cents: int}>
     */
    protected function mergeRevenueTrend(array $bookingSeries, array $posSeries): array
    {
        $posByDate = collect($posSeries)->keyBy('date');

        return collect($bookingSeries)->map(function (array $point) use ($posByDate) {
            $pos = (int) ($posByDate->get($point['date'])['revenue_cents'] ?? 0);

            return [
                'date' => $point['date'],
                'label' => $point['label'],
                'revenue_cents' => (int) ($point['revenue_cents'] ?? 0) + $pos,
            ];
        })->values()->all();
    }

    /**
     * @return list<array{method: string, amount_cents: int, count: int}>
     */
    protected function paymentMethodBreakdown(ReportFilters $filters): array
    {
        $methods = [];

        $saleRows = $this->completedSaleQuery($filters)
            ->select('payment_method', DB::raw('SUM(total_cents) as amount_cents'), DB::raw('COUNT(*) as count'))
            ->groupBy('payment_method')
            ->get();

        foreach ($saleRows as $row) {
            $key = $this->labelPaymentMethod((string) $row->payment_method);
            $methods[$key] = [
                'method' => $key,
                'amount_cents' => (int) ($methods[$key]['amount_cents'] ?? 0) + (int) $row->amount_cents,
                'count' => (int) ($methods[$key]['count'] ?? 0) + (int) $row->count,
            ];
        }

        $providerRows = $this->paidTransactionQuery($filters)
            ->select('provider', DB::raw('SUM(amount_cents) as amount_cents'), DB::raw('COUNT(*) as count'))
            ->groupBy('provider')
            ->get();

        foreach ($providerRows as $row) {
            $key = $this->labelPaymentMethod((string) $row->provider);
            $methods[$key] = [
                'method' => $key,
                'amount_cents' => (int) ($methods[$key]['amount_cents'] ?? 0) + (int) $row->amount_cents,
                'count' => (int) ($methods[$key]['count'] ?? 0) + (int) $row->count,
            ];
        }

        return collect($methods)
            ->sortByDesc('amount_cents')
            ->values()
            ->all();
    }

    protected function labelPaymentMethod(string $raw): string
    {
        return match (strtolower($raw)) {
            'cash' => 'Cash',
            'card' => 'Card',
            'mobile_money', 'mtn_momo', 'momo' => 'Mobile money',
            'paystack' => 'Paystack',
            'flutterwave' => 'Flutterwave',
            'ussd' => 'USSD',
            'other' => 'Other',
            default => ucfirst(str_replace('_', ' ', $raw)),
        };
    }

    /**
     * @return list<array<string, mixed>>
     */
    protected function recentPayments(int $tenantId, ?int $locationId): array
    {
        $requests = PaymentRequest::query()
            ->where('tenant_id', $tenantId)
            ->when($locationId, fn ($q) => $q->where('branch_id', $locationId))
            ->with('customer:id,name')
            ->orderByDesc('created_at')
            ->limit(6)
            ->get()
            ->map(fn (PaymentRequest $row) => [
                'id' => $row->id,
                'source' => 'payment_request',
                'reference' => $row->reference,
                'status' => $row->status->value ?? (string) $row->status,
                'amount_cents' => (int) $row->amount_cents,
                'currency' => $row->currency,
                'customer_name' => $row->customer?->name,
                'occurred_at' => $row->paid_at?->toIso8601String() ?? $row->created_at?->toIso8601String(),
            ]);

        $transactions = PaymentTransaction::query()
            ->withoutGlobalScope('tenant')
            ->where('tenant_id', $tenantId)
            ->with('user:id,name')
            ->orderByDesc('created_at')
            ->limit(6)
            ->get()
            ->map(fn (PaymentTransaction $row) => [
                'id' => $row->id,
                'source' => 'payment_transaction',
                'reference' => $row->provider_reference ?? $row->uuid,
                'status' => $row->status,
                'amount_cents' => (int) $row->amount_cents,
                'currency' => $row->currency,
                'customer_name' => $row->user?->name,
                'occurred_at' => $row->paid_at?->toIso8601String() ?? $row->created_at?->toIso8601String(),
            ]);

        return $requests
            ->merge($transactions)
            ->sortByDesc('occurred_at')
            ->take(8)
            ->values()
            ->all();
    }

    /** @return list<string> */
    protected function dateSeries(Carbon $from, Carbon $to): array
    {
        $days = [];
        $cursor = $from->copy()->startOfDay();
        $end = $to->copy()->startOfDay();

        while ($cursor->lte($end)) {
            $days[] = $cursor->toDateString();
            $cursor->addDay();
        }

        return $days;
    }
}
