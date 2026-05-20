<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\OnboardingStatus;
use App\Http\Controllers\Controller;
use App\Models\PlatformSubscription;
use App\Models\SmsMessage;
use App\Models\Tenant;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;

class AdminDashboardController extends Controller
{
    public function __invoke(): JsonResponse
    {
        $this->authorize('viewAny', Tenant::class);

        $tenantCount = Tenant::query()->count();
        $paidSubscriptions = PlatformSubscription::query()->where('status', 'paid')->count();
        $unpaidSignups = User::query()
            ->where('account_intent', 'salon_owner')
            ->where('onboarding_status', OnboardingStatus::PaymentPending)
            ->count();
        $paidNotOnboarded = User::query()
            ->where('account_intent', 'salon_owner')
            ->where('onboarding_status', OnboardingStatus::Paid)
            ->count();
        $onboardedOwners = User::query()
            ->where('onboarding_status', OnboardingStatus::Onboarded)
            ->count();

        $revenueCents = (int) PlatformSubscription::query()
            ->where('status', 'paid')
            ->sum('final_amount_cents');

        $smsSent = SmsMessage::query()->where('status', 'sent')->count();
        $smsFailed = SmsMessage::query()->whereIn('status', ['failed', 'error'])->count();

        $recentTenants = Tenant::query()
            ->withCount('users')
            ->latest()
            ->limit(5)
            ->get()
            ->map(fn (Tenant $t) => [
                'name' => $t->name,
                'slug' => $t->slug,
                'plan' => $t->plan,
                'status' => $t->status?->value ?? $t->status,
                'created_at' => $t->created_at?->toIso8601String(),
            ]);

        return response()->json([
            'stats' => [
                'tenants' => $tenantCount,
                'paid_subscriptions' => $paidSubscriptions,
                'unpaid_signups' => $unpaidSignups,
                'paid_awaiting_setup' => $paidNotOnboarded,
                'onboarded_owners' => $onboardedOwners,
                'revenue_cents' => $revenueCents,
                'sms_sent' => $smsSent,
                'sms_failed' => $smsFailed,
            ],
            'recent_tenants' => $recentTenants,
            'charts' => [
                'signups' => $this->monthlySignups(),
                'revenue' => $this->monthlyRevenue(),
            ],
        ]);
    }

    /** @return list<array{month: string, count: int}> */
    protected function monthlySignups(): array
    {
        $start = Carbon::now()->subMonths(5)->startOfMonth();
        $counts = [];

        User::query()
            ->where('account_intent', 'salon_owner')
            ->where('created_at', '>=', $start)
            ->get(['created_at'])
            ->each(function (User $user) use (&$counts) {
                $month = $user->created_at->format('Y-m');
                $counts[$month] = ($counts[$month] ?? 0) + 1;
            });

        return $this->fillMonthSeries($start, 6, $counts, 'count');
    }

    /** @return list<array{month: string, revenue_cents: int}> */
    protected function monthlyRevenue(): array
    {
        $start = Carbon::now()->subMonths(5)->startOfMonth();
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

        $filled = [];
        for ($i = 0; $i < 6; $i++) {
            $month = $start->copy()->addMonths($i)->format('Y-m');
            $filled[] = [
                'month' => $month,
                'revenue_cents' => (int) ($totals[$month] ?? 0),
            ];
        }

        return $filled;
    }

    /**
     * @param  array<string, int>  $counts
     * @return list<array{month: string, count: int}>
     */
    protected function fillMonthSeries(Carbon $start, int $months, array $counts, string $valueKey): array
    {
        $filled = [];
        for ($i = 0; $i < $months; $i++) {
            $month = $start->copy()->addMonths($i)->format('Y-m');
            $filled[] = [
                'month' => $month,
                $valueKey => (int) ($counts[$month] ?? 0),
            ];
        }

        return $filled;
    }
}
