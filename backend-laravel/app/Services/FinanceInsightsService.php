<?php

namespace App\Services;

use App\Models\PaymentTransaction;
use App\Models\Sale;
use App\Support\ReportFilters;
use Carbon\Carbon;

class FinanceInsightsService
{
    public function __construct(
        private readonly FinanceOverviewService $overview,
        private readonly ReportsService $reports,
        private readonly FinancePayrollService $payroll,
        private readonly TenantExpenseService $expenses,
    ) {}

    /** @return array<string, mixed> */
    public function dashboard(ReportFilters $filters): array
    {
        $tenantId = (int) $filters->tenantId;
        $overview = $this->overview->overview($filters);
        $cards = $overview['cards'] ?? [];
        $revenueTrend = $overview['charts']['revenue_trend'] ?? [];
        $tenantReport = $this->reports->tenantReport($filters);

        $grossRevenue = (int) ($cards['gross_revenue_cents'] ?? 0);
        $discounts = (int) ($cards['discounts_cents'] ?? 0);
        $refunds = (int) ($cards['refunds_cents'] ?? 0);
        $expenses = (int) ($cards['expenses_cents'] ?? 0);
        $outstandingInvoices = (int) ($cards['outstanding_invoices_cents'] ?? 0);
        $walletAvailable = (int) ($cards['wallet_available_cents'] ?? 0);

        $payrollSummary = $this->payroll->summary($tenantId, [
            'from' => $filters->from->toDateString(),
            'to' => $filters->to->toDateString(),
        ], null)['summary'] ?? [];
        $payrollCents = (int) ($payrollSummary['total_payroll_cents'] ?? 0);

        $priorFrom = $filters->from->copy()->subDays($filters->from->diffInDays($filters->to) + 1)->startOfDay();
        $priorTo = $filters->from->copy()->subDay()->endOfDay();
        $priorExpenses = $this->expenses->sumInRange($tenantId, $priorFrom, $priorTo, $filters->locationId);

        $refundRate = $grossRevenue > 0 ? round(($refunds / $grossRevenue) * 100, 2) : 0.0;
        $discountRate = $grossRevenue > 0 ? round(($discounts / $grossRevenue) * 100, 2) : 0.0;
        $payrollRatio = $grossRevenue > 0 ? round(($payrollCents / $grossRevenue) * 100, 2) : 0.0;
        $expenseChange = $priorExpenses > 0
            ? round((($expenses - $priorExpenses) / $priorExpenses) * 100, 2)
            : ($expenses > 0 ? 100.0 : 0.0);

        $forecast = $this->monthlyForecast($tenantId, $filters->locationId);
        $busiestDays = $this->busiestRevenueDays($revenueTrend);
        $topStaff = array_slice($tenantReport['staff_performance'] ?? [], 0, 5);
        $underperformingServices = $this->underperformingServices($tenantReport['popular_services'] ?? []);

        $insights = $this->buildInsights(
            grossRevenue: $grossRevenue,
            refundRate: $refundRate,
            discountRate: $discountRate,
            payrollRatio: $payrollRatio,
            expenseChange: $expenseChange,
            expenses: $expenses,
            priorExpenses: $priorExpenses,
            outstandingInvoices: $outstandingInvoices,
            walletAvailable: $walletAvailable,
            payrollCents: $payrollCents,
            forecast: $forecast,
            busiestDays: $busiestDays,
            topStaff: $topStaff,
            underperformingServices: $underperformingServices,
            failedPaymentsCount: (int) ($cards['failed_payments_count'] ?? 0),
        );

        return [
            'filters' => $filters->toArray(),
            'forecast' => $forecast,
            'busiest_days' => $busiestDays,
            'highlights' => [
                'top_staff' => $topStaff,
                'underperforming_services' => $underperformingServices,
            ],
            'metrics' => [
                'gross_revenue_cents' => $grossRevenue,
                'refund_rate_percent' => $refundRate,
                'discount_rate_percent' => $discountRate,
                'payroll_to_revenue_percent' => $payrollRatio,
                'expense_change_percent' => $expenseChange,
                'current_expenses_cents' => $expenses,
                'prior_expenses_cents' => $priorExpenses,
                'outstanding_invoices_cents' => $outstandingInvoices,
                'wallet_available_cents' => $walletAvailable,
                'payroll_cents' => $payrollCents,
            ],
            'trend_comparison' => [
                'revenue_trend' => $revenueTrend,
                'prior_period' => [
                    'from' => $priorFrom->toDateString(),
                    'to' => $priorTo->toDateString(),
                    'expenses_cents' => $priorExpenses,
                ],
            ],
            'insights' => $insights,
            'alert_channels' => [
                [
                    'channel' => 'in_app',
                    'label' => 'In-app finance alerts',
                    'enabled' => true,
                    'placeholder' => true,
                    'note' => 'Critical and warning insights appear on Finance home.',
                ],
                [
                    'channel' => 'push',
                    'label' => 'Push notifications',
                    'enabled' => false,
                    'placeholder' => true,
                    'note' => 'Mobile push alerts for finance thresholds — coming soon.',
                ],
            ],
        ];
    }

    /** @return array<string, mixed> */
    protected function monthlyForecast(int $tenantId, ?int $locationId): array
    {
        $mtdStart = Carbon::now()->startOfMonth();
        $mtdRevenue = $this->revenueSince($tenantId, $mtdStart, $locationId);
        $daysElapsed = max(1, Carbon::now()->day);
        $daysInMonth = Carbon::now()->daysInMonth;
        $dailyAverage = (int) round($mtdRevenue / $daysElapsed);
        $projected = (int) round($dailyAverage * $daysInMonth);

        return [
            'mtd_revenue_cents' => $mtdRevenue,
            'daily_average_cents' => $dailyAverage,
            'projected_month_revenue_cents' => $projected,
            'days_elapsed' => $daysElapsed,
            'days_in_month' => $daysInMonth,
        ];
    }

    /**
     * @param  list<array{date: string, label: string, revenue_cents: int}>  $revenueTrend
     * @return list<array{day_of_week: int, label: string, revenue_cents: int}>
     */
    protected function busiestRevenueDays(array $revenueTrend): array
    {
        $byDay = [];
        foreach ($revenueTrend as $point) {
            $date = Carbon::parse($point['date']);
            $dow = (int) $date->dayOfWeek;
            $byDay[$dow] = ($byDay[$dow] ?? 0) + (int) ($point['revenue_cents'] ?? 0);
        }

        $labels = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

        return collect($byDay)
            ->map(fn (int $cents, int $dow) => [
                'day_of_week' => $dow,
                'label' => $labels[$dow] ?? 'Day',
                'revenue_cents' => $cents,
            ])
            ->sortByDesc('revenue_cents')
            ->values()
            ->take(7)
            ->all();
    }

    /** @param  list<array{service_id: int, name: string, bookings: int, revenue_cents: int}>  $services
     * @return list<array{service_id: int, name: string, bookings: int, revenue_cents: int, avg_revenue_cents: int}>
     */
    protected function underperformingServices(array $services): array
    {
        if ($services === []) {
            return [];
        }

        $withAvg = collect($services)
            ->filter(fn (array $row) => ($row['bookings'] ?? 0) >= 2)
            ->map(fn (array $row) => [
                ...$row,
                'avg_revenue_cents' => (int) round(($row['revenue_cents'] ?? 0) / max(1, $row['bookings'] ?? 1)),
            ]);

        if ($withAvg->isEmpty()) {
            return [];
        }

        $medianAvg = (int) $withAvg->median('avg_revenue_cents');
        $threshold = max(1, (int) round($medianAvg * 0.55));

        return $withAvg
            ->filter(fn (array $row) => $row['avg_revenue_cents'] < $threshold)
            ->sortBy('avg_revenue_cents')
            ->take(5)
            ->values()
            ->all();
    }

    /**
     * @param  list<array<string, mixed>>  $busiestDays
     * @param  list<array<string, mixed>>  $topStaff
     * @param  list<array<string, mixed>>  $underperformingServices
     * @return list<array<string, mixed>>
     */
    protected function buildInsights(
        int $grossRevenue,
        float $refundRate,
        float $discountRate,
        float $payrollRatio,
        float $expenseChange,
        int $expenses,
        int $priorExpenses,
        int $outstandingInvoices,
        int $walletAvailable,
        int $payrollCents,
        array $forecast,
        array $busiestDays,
        array $topStaff,
        array $underperformingServices,
        int $failedPaymentsCount,
    ): array {
        $insights = [];

        $insights[] = [
            'id' => 'projected_revenue',
            'severity' => 'info',
            'title' => 'Projected monthly revenue',
            'message' => sprintf(
                'Based on %d days so far, you are on track for about %s this month.',
                $forecast['days_elapsed'] ?? 0,
                $this->moneyLabel($forecast['projected_month_revenue_cents'] ?? 0)
            ),
            'action' => 'Compare against last month and adjust marketing on slower days.',
            'metric_value' => $forecast['projected_month_revenue_cents'] ?? 0,
        ];

        if ($busiestDays !== []) {
            $top = $busiestDays[0];
            $insights[] = [
                'id' => 'busiest_day',
                'severity' => 'info',
                'title' => 'Busiest revenue day',
                'message' => sprintf('%s brings the most revenue in your selected period.', $top['label']),
                'action' => 'Promote low-demand slots on quieter days and staff up on '.$top['label'].'.',
                'metric_value' => $top['revenue_cents'] ?? 0,
            ];
        }

        if ($topStaff !== []) {
            $leader = $topStaff[0];
            $insights[] = [
                'id' => 'top_staff',
                'severity' => 'opportunity',
                'title' => 'Top revenue staff',
                'message' => sprintf('%s leads with %s from appointments.', $leader['name'] ?? 'A team member', $this->moneyLabel((int) ($leader['revenue_cents'] ?? 0))),
                'action' => 'Share their booking habits with the team or consider commission bonuses.',
                'metric_value' => $leader['revenue_cents'] ?? 0,
            ];
        }

        foreach ($underperformingServices as $service) {
            $insights[] = [
                'id' => 'underperforming_service_'.$service['service_id'],
                'severity' => 'warning',
                'title' => 'Underperforming service',
                'message' => sprintf('%s averages %s per booking — below your typical service yield.', $service['name'], $this->moneyLabel((int) $service['avg_revenue_cents'])),
                'action' => 'Review pricing, upsells, duration, or promotion for this service.',
                'metric_value' => $service['avg_revenue_cents'],
            ];
        }

        if ($refundRate >= 10) {
            $insights[] = [
                'id' => 'high_refund_rate',
                'severity' => 'critical',
                'title' => 'High refund rate',
                'message' => sprintf('Refunds are %.1f%% of gross revenue in this period.', $refundRate),
                'action' => 'Review checkout quality, staff training, and refund reasons.',
                'metric_value' => $refundRate,
            ];
        } elseif ($refundRate >= 5) {
            $insights[] = [
                'id' => 'elevated_refund_rate',
                'severity' => 'warning',
                'title' => 'Elevated refund rate',
                'message' => sprintf('Refunds are %.1f%% of gross revenue.', $refundRate),
                'action' => 'Watch refund trends and tighten approval rules if needed.',
                'metric_value' => $refundRate,
            ];
        }

        if ($discountRate >= 20) {
            $insights[] = [
                'id' => 'high_discount_rate',
                'severity' => 'critical',
                'title' => 'Heavy discounting',
                'message' => sprintf('Discounts are %.1f%% of gross revenue.', $discountRate),
                'action' => 'Reduce manual discounts and review coupon usage at checkout.',
                'metric_value' => $discountRate,
            ];
        } elseif ($discountRate >= 10) {
            $insights[] = [
                'id' => 'elevated_discount_rate',
                'severity' => 'warning',
                'title' => 'Discounts eating margin',
                'message' => sprintf('Discounts are %.1f%% of gross revenue.', $discountRate),
                'action' => 'Tighten discount approval and promote full-price bundles instead.',
                'metric_value' => $discountRate,
            ];
        }

        if ($payrollRatio >= 60) {
            $insights[] = [
                'id' => 'payroll_ratio_critical',
                'severity' => 'critical',
                'title' => 'Payroll burden is high',
                'message' => sprintf('Estimated payroll is %.1f%% of revenue.', $payrollRatio),
                'action' => 'Review staffing levels, pricing, or commission structures.',
                'metric_value' => $payrollRatio,
            ];
        } elseif ($payrollRatio >= 45) {
            $insights[] = [
                'id' => 'payroll_ratio_warning',
                'severity' => 'warning',
                'title' => 'Payroll-to-revenue ratio elevated',
                'message' => sprintf('Payroll is %.1f%% of revenue for this period.', $payrollRatio),
                'action' => 'Track utilization and align schedules with demand.',
                'metric_value' => $payrollRatio,
            ];
        }

        if ($expenseChange >= 30 && $expenses > 0) {
            $insights[] = [
                'id' => 'expense_spike',
                'severity' => 'warning',
                'title' => 'Expense spike detected',
                'message' => sprintf('Operating expenses rose %.1f%% vs the prior period (%s → %s).', $expenseChange, $this->moneyLabel($priorExpenses), $this->moneyLabel($expenses)),
                'action' => 'Review recent vendor bills and one-off purchases.',
                'metric_value' => $expenseChange,
            ];
        }

        $cashPressure = $outstandingInvoices + $payrollCents;
        if ($walletAvailable < $cashPressure && $cashPressure > 0) {
            $insights[] = [
                'id' => 'low_cashflow',
                'severity' => 'critical',
                'title' => 'Low cashflow cushion',
                'message' => sprintf('Wallet available (%s) is below invoices due plus payroll (%s).', $this->moneyLabel($walletAvailable), $this->moneyLabel($cashPressure)),
                'action' => 'Follow up unpaid invoices and delay non-essential expenses.',
                'metric_value' => $walletAvailable,
            ];
        } elseif ($outstandingInvoices > 0 && $outstandingInvoices > $grossRevenue * 0.15) {
            $insights[] = [
                'id' => 'unpaid_invoices',
                'severity' => 'warning',
                'title' => 'Outstanding invoices building up',
                'message' => sprintf('You have %s in unpaid invoices.', $this->moneyLabel($outstandingInvoices)),
                'action' => 'Send reminders and enable MoMo payment links for faster collection.',
                'metric_value' => $outstandingInvoices,
            ];
        }

        if ($failedPaymentsCount >= 3) {
            $insights[] = [
                'id' => 'failed_payments',
                'severity' => 'warning',
                'title' => 'Failed payments need attention',
                'message' => sprintf('%d failed payment attempts in this period.', $failedPaymentsCount),
                'action' => 'Contact clients with failed MoMo/card attempts and retry collection.',
                'metric_value' => $failedPaymentsCount,
            ];
        }

        $hasWarnings = collect($insights)->contains(fn (array $row) => in_array($row['severity'], ['critical', 'warning'], true));
        if ($grossRevenue > 0 && ! $hasWarnings) {
            $insights[] = [
                'id' => 'healthy_period',
                'severity' => 'opportunity',
                'title' => 'Finance looks stable',
                'message' => 'No major warnings detected for this period.',
                'action' => 'Keep monitoring trends and reinvest in top services and staff.',
                'metric_value' => $grossRevenue,
            ];
        }

        $severityOrder = ['critical' => 0, 'warning' => 1, 'opportunity' => 2, 'info' => 3];

        return collect($insights)
            ->sortBy(fn (array $row) => $severityOrder[$row['severity']] ?? 9)
            ->values()
            ->all();
    }

    protected function revenueSince(int $tenantId, Carbon $since, ?int $locationId): int
    {
        $paid = (int) PaymentTransaction::query()
            ->withoutGlobalScope('tenant')
            ->where('tenant_id', $tenantId)
            ->where('status', 'paid')
            ->where('paid_at', '>=', $since)
            ->when($locationId, function ($q) use ($locationId) {
                $q->where(function ($inner) use ($locationId) {
                    $inner->whereHas('appointment', fn ($apt) => $apt->where('location_id', $locationId))
                        ->orWhereHas('sale', fn ($sale) => $sale->where('location_id', $locationId));
                });
            })
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

    protected function moneyLabel(int $cents): string
    {
        return number_format($cents / 100, 2);
    }
}
