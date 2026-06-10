<?php

namespace App\Services;

use App\Enums\PaymentRequestStatus;
use App\Enums\ProviderAccountStatus;
use App\Enums\TenantStatus;
use App\Models\PaymentFailureLog;
use App\Models\PaymentProviderAccount;
use App\Models\PaymentRequest;
use App\Models\PlatformPlan;
use App\Models\PlatformSubscription;
use App\Models\SmsProviderBalance;
use App\Models\Tenant;
use Carbon\Carbon;

class PlatformMetricsService
{
    /** @return array<string, int|float|string|null> */
    public function cards(): array
    {
        $mnotify = SmsProviderBalance::query()->where('provider', 'mnotify')->first();
        $providerIncidents = PaymentProviderAccount::query()
            ->whereIn('status', [
                ProviderAccountStatus::Failed->value,
                ProviderAccountStatus::Blocked->value,
            ])
            ->count();

        if ($mnotify && in_array($mnotify->status, ['error', 'failed', 'degraded'], true)) {
            $providerIncidents++;
        }

        return [
            'active_tenants' => Tenant::query()->where('status', TenantStatus::Active)->count(),
            'trial_tenants' => Tenant::query()
                ->whereNotNull('trial_ends_at')
                ->where('trial_ends_at', '>', now())
                ->count(),
            'mrr_cents' => $this->mrrCents(),
            'revenue_collected_cents' => (int) PlatformSubscription::query()
                ->where('status', 'paid')
                ->sum('final_amount_cents'),
            'failed_payments' => $this->failedPaymentCount(),
            'open_support_tickets' => 0,
            'sms_balance' => (int) ($mnotify?->balance_credits ?? 0),
            'provider_incidents' => $providerIncidents,
            'mnotify_status' => $mnotify?->status ?? 'pending_sync',
            'mnotify_last_synced_at' => $mnotify?->last_synced_at?->toIso8601String(),
        ];
    }

    /** @return array<string, mixed> */
    public function overview(): array
    {
        $cards = $this->cards();
        $charts = $this->charts();

        return [
            'cards' => $cards,
            'stats' => $this->legacyStats($cards),
            'alerts' => $this->alerts($cards),
            'recent_tenants' => $this->recentTenants(),
            'charts' => $charts,
        ];
    }

    /** @return list<array{type: string, title: string, count: int, severity: string}> */
    public function alerts(array $cards): array
    {
        $alerts = [];

        if (($cards['failed_payments'] ?? 0) > 0) {
            $alerts[] = [
                'type' => 'failed_payments',
                'title' => 'Failed payments need review',
                'count' => (int) $cards['failed_payments'],
                'severity' => 'high',
            ];
        }

        if (($cards['provider_incidents'] ?? 0) > 0) {
            $alerts[] = [
                'type' => 'provider_health',
                'title' => 'Payment or SMS provider incidents',
                'count' => (int) $cards['provider_incidents'],
                'severity' => 'high',
            ];
        }

        if (($cards['open_support_tickets'] ?? 0) > 0) {
            $alerts[] = [
                'type' => 'support',
                'title' => 'Open support tickets',
                'count' => (int) $cards['open_support_tickets'],
                'severity' => 'medium',
            ];
        }

        if (($cards['trial_tenants'] ?? 0) > 0) {
            $alerts[] = [
                'type' => 'trials',
                'title' => 'Salons on trial',
                'count' => (int) $cards['trial_tenants'],
                'severity' => 'info',
            ];
        }

        return $alerts;
    }

    /** @return array<string, list<array<string, int|string>>> */
    public function charts(): array
    {
        $start = Carbon::now()->subMonths(5)->startOfMonth();

        return [
            'mrr_trend' => $this->monthlyRevenueSeries($start),
            'tenant_growth' => $this->monthlyTenantSeries($start),
            'payment_volume' => $this->monthlyPaymentVolumeSeries($start),
            'support_ticket_trend' => $this->emptyMonthSeries($start, 'count'),
            'signups' => $this->monthlyOwnerSignupSeries($start),
            'revenue' => $this->monthlyRevenueSeries($start),
        ];
    }

    protected function mrrCents(): int
    {
        $plans = PlatformPlan::query()
            ->whereBool('is_active', true)
            ->get(['slug', 'price_cents', 'interval'])
            ->keyBy('slug');

        return (int) Tenant::query()
            ->where('status', TenantStatus::Active)
            ->get(['plan'])
            ->sum(function (Tenant $tenant) use ($plans) {
                $plan = $plans->get($tenant->plan);

                if (! $plan || ! $plan->price_cents) {
                    return 0;
                }

                return $plan->interval === 'year'
                    ? (int) intdiv($plan->price_cents, 12)
                    : (int) $plan->price_cents;
            });
    }

    protected function failedPaymentCount(): int
    {
        $failureLogs = PaymentFailureLog::query()->withoutGlobalScope('tenant')->count();
        $requestFailures = PaymentRequest::query()
            ->withoutGlobalScopes()
            ->where('status', PaymentRequestStatus::Failed->value)
            ->count();

        return $failureLogs + $requestFailures;
    }

    /** @return list<array{name: string, slug: string, plan: string|null, status: string|null, created_at: string|null}> */
    protected function recentTenants(): array
    {
        return Tenant::query()
            ->latest()
            ->limit(5)
            ->get(['name', 'slug', 'plan', 'status', 'created_at'])
            ->map(fn (Tenant $tenant) => [
                'name' => $tenant->name,
                'slug' => $tenant->slug,
                'plan' => $tenant->plan,
                'status' => $tenant->status instanceof \BackedEnum ? $tenant->status->value : $tenant->status,
                'created_at' => $tenant->created_at?->toIso8601String(),
            ])
            ->all();
    }

    /**
     * Legacy dashboard stats for existing clients.
     *
     * @param  array<string, mixed>  $cards
     * @return array<string, int|string|null>
     */
    protected function legacyStats(array $cards): array
    {
        return [
            'tenants' => (int) ($cards['active_tenants'] ?? 0),
            'paid_subscriptions' => PlatformSubscription::query()->where('status', 'paid')->count(),
            'unpaid_signups' => \App\Models\User::query()
                ->where('account_intent', 'salon_owner')
                ->where('onboarding_status', \App\Enums\OnboardingStatus::PaymentPending)
                ->count(),
            'paid_awaiting_setup' => \App\Models\User::query()
                ->where('account_intent', 'salon_owner')
                ->where('onboarding_status', \App\Enums\OnboardingStatus::Paid)
                ->count(),
            'onboarded_owners' => \App\Models\User::query()
                ->where('onboarding_status', \App\Enums\OnboardingStatus::Onboarded)
                ->count(),
            'revenue_cents' => (int) ($cards['revenue_collected_cents'] ?? 0),
            'sms_sent' => \App\Models\SmsMessage::query()->where('status', 'sent')->count(),
            'sms_failed' => \App\Models\SmsMessage::query()->whereIn('status', ['failed', 'error'])->count(),
            'mnotify_balance' => (int) ($cards['sms_balance'] ?? 0),
            'mnotify_status' => $cards['mnotify_status'] ?? 'pending_sync',
            'mnotify_last_synced_at' => $cards['mnotify_last_synced_at'] ?? null,
            'mrr_cents' => (int) ($cards['mrr_cents'] ?? 0),
            'trial_tenants' => (int) ($cards['trial_tenants'] ?? 0),
            'failed_payments' => (int) ($cards['failed_payments'] ?? 0),
            'open_support_tickets' => (int) ($cards['open_support_tickets'] ?? 0),
            'provider_incidents' => (int) ($cards['provider_incidents'] ?? 0),
        ];
    }

    /** @return list<array{month: string, revenue_cents: int}> */
    protected function monthlyRevenueSeries(Carbon $start): array
    {
        $totals = [];

        PlatformSubscription::query()
            ->where('status', 'paid')
            ->where('paid_at', '>=', $start)
            ->get(['paid_at', 'final_amount_cents'])
            ->each(function (PlatformSubscription $sub) use (&$totals) {
                if (! $sub->paid_at) {
                    return;
                }
                $month = $sub->paid_at->format('Y-m');
                $totals[$month] = ($totals[$month] ?? 0) + (int) $sub->final_amount_cents;
            });

        return $this->fillMonthSeries($start, 6, $totals, 'revenue_cents');
    }

    /** @return list<array{month: string, count: int}> */
    protected function monthlyTenantSeries(Carbon $start): array
    {
        $counts = [];

        Tenant::query()
            ->where('created_at', '>=', $start)
            ->get(['created_at'])
            ->each(function (Tenant $tenant) use (&$counts) {
                $month = $tenant->created_at->format('Y-m');
                $counts[$month] = ($counts[$month] ?? 0) + 1;
            });

        return $this->fillMonthSeries($start, 6, $counts, 'count');
    }

    /** @return list<array{month: string, count: int, amount_cents: int}> */
    protected function monthlyPaymentVolumeSeries(Carbon $start): array
    {
        $counts = [];
        $amounts = [];

        PlatformSubscription::query()
            ->where('status', 'paid')
            ->where('paid_at', '>=', $start)
            ->get(['paid_at', 'final_amount_cents'])
            ->each(function (PlatformSubscription $sub) use (&$counts, &$amounts) {
                if (! $sub->paid_at) {
                    return;
                }
                $month = $sub->paid_at->format('Y-m');
                $counts[$month] = ($counts[$month] ?? 0) + 1;
                $amounts[$month] = ($amounts[$month] ?? 0) + (int) $sub->final_amount_cents;
            });

        $filled = [];
        for ($i = 0; $i < 6; $i++) {
            $month = $start->copy()->addMonths($i)->format('Y-m');
            $filled[] = [
                'month' => $month,
                'count' => (int) ($counts[$month] ?? 0),
                'amount_cents' => (int) ($amounts[$month] ?? 0),
            ];
        }

        return $filled;
    }

    /** @return list<array{month: string, count: int}> */
    protected function monthlyOwnerSignupSeries(Carbon $start): array
    {
        $counts = [];

        \App\Models\User::query()
            ->where('account_intent', 'salon_owner')
            ->where('created_at', '>=', $start)
            ->get(['created_at'])
            ->each(function (\App\Models\User $user) use (&$counts) {
                $month = $user->created_at->format('Y-m');
                $counts[$month] = ($counts[$month] ?? 0) + 1;
            });

        return $this->fillMonthSeries($start, 6, $counts, 'count');
    }

    /** @return list<array{month: string, count: int}> */
    protected function emptyMonthSeries(Carbon $start, string $valueKey): array
    {
        return $this->fillMonthSeries($start, 6, [], $valueKey);
    }

    /**
     * @param  array<string, int>  $values
     * @return list<array<string, int|string>>
     */
    protected function fillMonthSeries(Carbon $start, int $months, array $values, string $valueKey): array
    {
        $filled = [];
        for ($i = 0; $i < $months; $i++) {
            $month = $start->copy()->addMonths($i)->format('Y-m');
            $filled[] = [
                'month' => $month,
                $valueKey => (int) ($values[$month] ?? 0),
            ];
        }

        return $filled;
    }
}
