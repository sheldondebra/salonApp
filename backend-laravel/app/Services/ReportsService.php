<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\Location;
use App\Models\PaymentTransaction;
use App\Models\PlatformSubscription;
use App\Models\Service;
use App\Models\SmsMessage;
use App\Models\StaffMember;
use App\Models\Tenant;
use App\Models\User;
use App\Enums\UserType;
use App\Support\ReportFilters;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

class ReportsService
{
    /**
     * @return array<string, mixed>
     */
    public function tenantReport(ReportFilters $filters): array
    {
        $tenantId = $filters->tenantId;
        $appointments = $this->appointmentQuery($filters);
        $days = $this->dateSeries($filters->from, $filters->to);

        $revenueSeries = $this->revenueSeries($filters, $days);
        $bookingsSeries = $this->bookingsSeries($appointments, $days);
        $customersSeries = $this->customersSeries($filters, $days);

        return [
            'filters' => $filters->toArray(),
            'summary' => [
                'revenue_cents' => (int) collect($revenueSeries)->sum('revenue_cents'),
                'bookings' => (int) (clone $appointments)->count(),
                'customers' => (int) (clone $appointments)->distinct('client_user_id')->count('client_user_id'),
                'new_customers' => $this->newCustomersCount($filters),
                'sms_sent' => $this->smsCount($tenantId, $filters, 'sent'),
                'sms_failed' => $this->smsCount($tenantId, $filters, 'failed'),
            ],
            'revenue' => $revenueSeries,
            'bookings' => $bookingsSeries,
            'customers' => $customersSeries,
            'staff_performance' => $this->staffPerformance($filters),
            'popular_services' => $this->popularServices($filters),
            'payment_status' => $this->paymentStatusBreakdown($filters),
            'sms_usage' => $this->smsUsageSeries($tenantId, $filters, $days),
            'filter_options' => $this->tenantFilterOptions($tenantId),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function adminReport(ReportFilters $filters): array
    {
        $days = $this->dateSeries($filters->from, $filters->to);

        return [
            'filters' => $filters->toArray(),
            'summary' => [
                'tenants' => Tenant::query()->count(),
                'new_tenants' => Tenant::query()
                    ->whereBetween('created_at', [$filters->from, $filters->to])
                    ->count(),
                'mrr_cents' => $this->currentMrrCents(),
                'subscription_revenue_cents' => (int) PlatformSubscription::query()
                    ->where('status', 'paid')
                    ->whereBetween('paid_at', [$filters->from, $filters->to])
                    ->sum('final_amount_cents'),
                'sms_sent' => SmsMessage::query()
                    ->where('status', 'sent')
                    ->whereBetween('created_at', [$filters->from, $filters->to])
                    ->count(),
                'sms_failed' => SmsMessage::query()
                    ->whereIn('status', ['failed', 'error'])
                    ->whereBetween('created_at', [$filters->from, $filters->to])
                    ->count(),
                'platform_bookings' => Appointment::query()
                    ->withoutGlobalScope('tenant')
                    ->whereBetween('starts_at', [$filters->from, $filters->to])
                    ->count(),
            ],
            'tenant_growth' => $this->tenantGrowthSeries($filters),
            'subscription_mrr' => $this->subscriptionMrrSeries($filters),
            'subscription_revenue' => $this->subscriptionRevenueSeries($filters, $days),
            'sms_usage' => $this->platformSmsSeries($filters, $days),
            'bookings_by_tenant' => $this->topTenantsByBookings($filters),
        ];
    }

    protected function appointmentQuery(ReportFilters $filters): Builder
    {
        $query = Appointment::query()
            ->withoutGlobalScope('tenant')
            ->whereBetween('appointments.starts_at', [$filters->from, $filters->to]);

        if ($filters->tenantId) {
            $query->where('appointments.tenant_id', $filters->tenantId);
        }

        if ($filters->locationId) {
            $query->where('appointments.location_id', $filters->locationId);
        }

        if ($filters->staffMemberId) {
            $query->where('appointments.staff_member_id', $filters->staffMemberId);
        }

        if ($filters->serviceId) {
            $query->where('appointments.service_id', $filters->serviceId);
        }

        if ($filters->status) {
            $query->where('appointments.status', $filters->status);
        }

        return $query;
    }

    /**
     * @param  list<string>  $days
     * @return list<array{date: string, label: string, revenue_cents: int}>
     */
    protected function revenueSeries(ReportFilters $filters, array $days): array
    {
        $paymentRows = PaymentTransaction::query()
            ->withoutGlobalScope('tenant')
            ->where('status', 'paid')
            ->whereBetween('paid_at', [$filters->from, $filters->to])
            ->when($filters->tenantId, fn ($q) => $q->where('tenant_id', $filters->tenantId))
            ->when(
                $filters->locationId || $filters->staffMemberId || $filters->serviceId || $filters->status,
                function ($q) use ($filters) {
                    $q->whereHas('appointment', function ($apt) use ($filters) {
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
                    });
                }
            )
            ->select(
                DB::raw('DATE(paid_at) as date'),
                DB::raw('SUM(amount_cents) as revenue_cents')
            )
            ->groupBy('date')
            ->pluck('revenue_cents', 'date');

        $bookedRows = (clone $this->appointmentQuery($filters))
            ->whereIn('status', ['confirmed', 'completed'])
            ->join('services', 'appointments.service_id', '=', 'services.id')
            ->select(
                DB::raw('DATE(appointments.starts_at) as date'),
                DB::raw('SUM(services.price_cents) as revenue_cents')
            )
            ->groupBy('date')
            ->pluck('revenue_cents', 'date');

        return collect($days)->map(function (string $date) use ($paymentRows, $bookedRows) {
            $paid = (int) ($paymentRows[$date] ?? 0);
            $booked = (int) ($bookedRows[$date] ?? 0);

            return [
                'date' => $date,
                'label' => Carbon::parse($date)->format('M j'),
                'revenue_cents' => $paid > 0 ? $paid : $booked,
                'collected_cents' => $paid,
                'booked_cents' => $booked,
            ];
        })->values()->all();
    }

    /**
     * @param  list<string>  $days
     * @return list<array{date: string, label: string, count: int}>
     */
    protected function bookingsSeries(Builder $appointments, array $days): array
    {
        $rows = (clone $appointments)
            ->select(DB::raw('DATE(starts_at) as date'), DB::raw('COUNT(*) as count'))
            ->groupBy('date')
            ->pluck('count', 'date');

        return collect($days)->map(fn (string $date) => [
            'date' => $date,
            'label' => Carbon::parse($date)->format('M j'),
            'count' => (int) ($rows[$date] ?? 0),
        ])->values()->all();
    }

    /**
     * @param  list<string>  $days
     * @return list<array{date: string, label: string, count: int}>
     */
    protected function customersSeries(ReportFilters $filters, array $days): array
    {
        $tenantId = $filters->tenantId;
        if (! $tenantId) {
            return [];
        }

        $rows = DB::table('tenant_user')
            ->join('users', 'users.id', '=', 'tenant_user.user_id')
            ->where('tenant_user.tenant_id', $tenantId)
            ->where('users.user_type', UserType::Client->value)
            ->whereBetween('tenant_user.joined_at', [$filters->from, $filters->to])
            ->select(DB::raw('DATE(tenant_user.joined_at) as date'), DB::raw('COUNT(*) as count'))
            ->groupBy('date')
            ->pluck('count', 'date');

        return collect($days)->map(fn (string $date) => [
            'date' => $date,
            'label' => Carbon::parse($date)->format('M j'),
            'count' => (int) ($rows[$date] ?? 0),
        ])->values()->all();
    }

    protected function newCustomersCount(ReportFilters $filters): int
    {
        if (! $filters->tenantId) {
            return 0;
        }

        return User::query()
            ->where('user_type', UserType::Client)
            ->whereHas('tenants', function ($q) use ($filters) {
                $q->where('tenants.id', $filters->tenantId)
                    ->whereBetween('tenant_user.joined_at', [$filters->from, $filters->to]);
            })
            ->count();
    }

    /**
     * @return list<array{staff_id: int|null, name: string, bookings: int, revenue_cents: int}>
     */
    protected function staffPerformance(ReportFilters $filters): array
    {
        $rows = (clone $this->appointmentQuery($filters))
            ->leftJoin('staff_members', 'appointments.staff_member_id', '=', 'staff_members.id')
            ->leftJoin('services', 'appointments.service_id', '=', 'services.id')
            ->whereIn('appointments.status', ['confirmed', 'completed', 'pending'])
            ->select(
                'appointments.staff_member_id',
                DB::raw("COALESCE(staff_members.display_name, 'Unassigned') as name"),
                DB::raw('COUNT(*) as bookings'),
                DB::raw('SUM(services.price_cents) as revenue_cents')
            )
            ->groupBy('appointments.staff_member_id', 'staff_members.display_name')
            ->orderByDesc('bookings')
            ->limit(10)
            ->get();

        return $rows->map(fn ($row) => [
            'staff_id' => $row->staff_member_id,
            'name' => $row->name,
            'bookings' => (int) $row->bookings,
            'revenue_cents' => (int) $row->revenue_cents,
        ])->all();
    }

    /**
     * @return list<array{service_id: int, name: string, bookings: int, revenue_cents: int}>
     */
    protected function popularServices(ReportFilters $filters): array
    {
        return (clone $this->appointmentQuery($filters))
            ->join('services', 'appointments.service_id', '=', 'services.id')
            ->select(
                'appointments.service_id',
                'services.name',
                DB::raw('COUNT(*) as bookings'),
                DB::raw('SUM(services.price_cents) as revenue_cents')
            )
            ->groupBy('appointments.service_id', 'services.name')
            ->orderByDesc('bookings')
            ->limit(10)
            ->get()
            ->map(fn ($row) => [
                'service_id' => (int) $row->service_id,
                'name' => $row->name,
                'bookings' => (int) $row->bookings,
                'revenue_cents' => (int) $row->revenue_cents,
            ])
            ->all();
    }

    /**
     * @return list<array{status: string, count: int}>
     */
    protected function paymentStatusBreakdown(ReportFilters $filters): array
    {
        return (clone $this->appointmentQuery($filters))
            ->select('payment_status', DB::raw('COUNT(*) as count'))
            ->groupBy('payment_status')
            ->get()
            ->map(fn ($row) => [
                'status' => $row->payment_status ?: 'none',
                'count' => (int) $row->count,
            ])
            ->all();
    }

    /**
     * @param  list<string>  $days
     * @return list<array{date: string, label: string, sent: int, failed: int}>
     */
    protected function smsUsageSeries(?int $tenantId, ReportFilters $filters, array $days): array
    {
        $query = SmsMessage::query()
            ->whereBetween('created_at', [$filters->from, $filters->to]);

        if ($tenantId) {
            $query->where('tenant_id', $tenantId);
        }

        $sent = (clone $query)
            ->where('status', 'sent')
            ->select(DB::raw('DATE(created_at) as date'), DB::raw('COUNT(*) as count'))
            ->groupBy('date')
            ->pluck('count', 'date');

        $failed = (clone $query)
            ->whereIn('status', ['failed', 'error'])
            ->select(DB::raw('DATE(created_at) as date'), DB::raw('COUNT(*) as count'))
            ->groupBy('date')
            ->pluck('count', 'date');

        return collect($days)->map(fn (string $date) => [
            'date' => $date,
            'label' => Carbon::parse($date)->format('M j'),
            'sent' => (int) ($sent[$date] ?? 0),
            'failed' => (int) ($failed[$date] ?? 0),
        ])->values()->all();
    }

    protected function smsCount(?int $tenantId, ReportFilters $filters, string $type): int
    {
        $query = SmsMessage::query()
            ->whereBetween('created_at', [$filters->from, $filters->to]);

        if ($tenantId) {
            $query->where('tenant_id', $tenantId);
        }

        if ($type === 'sent') {
            $query->where('status', 'sent');
        } else {
            $query->whereIn('status', ['failed', 'error']);
        }

        return $query->count();
    }

    /**
     * @return array{locations: list<array{id: int, name: string}>, staff: list<array{id: int, name: string}>, services: list<array{id: int, name: string}>, statuses: list<string>}
     */
    protected function tenantFilterOptions(int $tenantId): array
    {
        return [
            'locations' => Location::query()
                ->withoutGlobalScope('tenant')
                ->where('tenant_id', $tenantId)
                ->whereBool('is_active')
                ->orderBy('name')
                ->get(['id', 'name'])
                ->map(fn ($l) => ['id' => $l->id, 'name' => $l->name])
                ->all(),
            'staff' => StaffMember::query()
                ->withoutGlobalScope('tenant')
                ->where('tenant_id', $tenantId)
                ->whereBool('is_active')
                ->orderBy('display_name')
                ->get(['id', 'display_name'])
                ->map(fn ($s) => ['id' => $s->id, 'name' => $s->display_name])
                ->all(),
            'services' => Service::query()
                ->withoutGlobalScope('tenant')
                ->where('tenant_id', $tenantId)
                ->whereBool('is_active')
                ->orderBy('name')
                ->get(['id', 'name'])
                ->map(fn ($s) => ['id' => $s->id, 'name' => $s->name])
                ->all(),
            'statuses' => ['pending', 'confirmed', 'completed', 'cancelled', 'no_show'],
        ];
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

    /**
     * @return list<array{month: string, label: string, count: int}>
     */
    protected function tenantGrowthSeries(ReportFilters $filters): array
    {
        $months = $this->monthSeries($filters->from, $filters->to);
        $counts = Tenant::query()
            ->whereBetween('created_at', [$filters->from, $filters->to])
            ->get(['created_at'])
            ->groupBy(fn ($t) => $t->created_at->format('Y-m'))
            ->map->count();

        return collect($months)->map(fn (string $month) => [
            'month' => $month,
            'label' => Carbon::createFromFormat('Y-m', $month)->format('M Y'),
            'count' => (int) ($counts[$month] ?? 0),
        ])->values()->all();
    }

    /**
     * @return list<array{month: string, label: string, mrr_cents: int}>
     */
    protected function subscriptionMrrSeries(ReportFilters $filters): array
    {
        $months = $this->monthSeries($filters->from, $filters->to);

        return collect($months)->map(function (string $month) {
            $endOfMonth = Carbon::createFromFormat('Y-m', $month)->endOfMonth();

            $mrr = PlatformSubscription::query()
                ->where('status', 'paid')
                ->where('paid_at', '<=', $endOfMonth)
                ->get(['final_amount_cents', 'paid_at', 'user_id'])
                ->groupBy('user_id')
                ->map(fn ($subs) => $subs->sortByDesc('paid_at')->first()?->final_amount_cents ?? 0)
                ->sum();

            return [
                'month' => $month,
                'label' => Carbon::createFromFormat('Y-m', $month)->format('M Y'),
                'mrr_cents' => (int) $mrr,
            ];
        })->values()->all();
    }

    /**
     * @param  list<string>  $days
     * @return list<array{date: string, label: string, revenue_cents: int}>
     */
    protected function subscriptionRevenueSeries(ReportFilters $filters, array $days): array
    {
        $rows = PlatformSubscription::query()
            ->where('status', 'paid')
            ->whereBetween('paid_at', [$filters->from, $filters->to])
            ->select(DB::raw('DATE(paid_at) as date'), DB::raw('SUM(final_amount_cents) as revenue_cents'))
            ->groupBy('date')
            ->pluck('revenue_cents', 'date');

        return collect($days)->map(fn (string $date) => [
            'date' => $date,
            'label' => Carbon::parse($date)->format('M j'),
            'revenue_cents' => (int) ($rows[$date] ?? 0),
        ])->values()->all();
    }

    /**
     * @param  list<string>  $days
     * @return list<array{date: string, label: string, sent: int, failed: int}>
     */
    protected function platformSmsSeries(ReportFilters $filters, array $days): array
    {
        return $this->smsUsageSeries(null, $filters, $days);
    }

    /**
     * @return list<array{tenant_id: int, name: string, slug: string, bookings: int}>
     */
    protected function topTenantsByBookings(ReportFilters $filters): array
    {
        return Appointment::query()
            ->withoutGlobalScope('tenant')
            ->whereBetween('starts_at', [$filters->from, $filters->to])
            ->join('tenants', 'appointments.tenant_id', '=', 'tenants.id')
            ->select(
                'appointments.tenant_id',
                'tenants.name',
                'tenants.slug',
                DB::raw('COUNT(*) as bookings')
            )
            ->groupBy('appointments.tenant_id', 'tenants.name', 'tenants.slug')
            ->orderByDesc('bookings')
            ->limit(10)
            ->get()
            ->map(fn ($row) => [
                'tenant_id' => (int) $row->tenant_id,
                'name' => $row->name,
                'slug' => $row->slug,
                'bookings' => (int) $row->bookings,
            ])
            ->all();
    }

    protected function currentMrrCents(): int
    {
        return (int) PlatformSubscription::query()
            ->where('status', 'paid')
            ->get(['final_amount_cents', 'paid_at', 'user_id'])
            ->groupBy('user_id')
            ->map(fn ($subs) => $subs->sortByDesc('paid_at')->first()?->final_amount_cents ?? 0)
            ->sum();
    }

    /** @return list<string> */
    protected function monthSeries(Carbon $from, Carbon $to): array
    {
        $months = [];
        $cursor = $from->copy()->startOfMonth();
        $end = $to->copy()->startOfMonth();

        while ($cursor->lte($end)) {
            $months[] = $cursor->format('Y-m');
            $cursor->addMonth();
        }

        return $months;
    }
}
