<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\Location;
use App\Models\PaymentTransaction;
use App\Models\Sale;
use App\Support\ReportFilters;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class BranchComparisonService
{
    /** @return array<string, mixed> */
    public function compare(ReportFilters $filters): array
    {
        $tenantId = $filters->tenantId;
        if (! $tenantId) {
            return [];
        }

        $locations = Location::query()
            ->where('tenant_id', $tenantId)
            ->when($filters->locationId, fn ($q) => $q->whereKey($filters->locationId))
            ->orderBy('name')
            ->get();

        $rows = $locations->map(function (Location $location) use ($filters) {
            $metrics = $this->locationMetrics($location, $filters);

            return [
                'location' => [
                    'id' => $location->id,
                    'uuid' => $location->uuid,
                    'name' => $location->name,
                    'city' => $location->city,
                    'address_line1' => $location->address_line1,
                ],
                'metrics' => $metrics,
            ];
        })->values();

        return [
            'filters' => $filters->toArray(),
            'summary' => [
                'locations_count' => $rows->count(),
                'highest_revenue_location' => $this->topLocation($rows, 'revenue_cents'),
                'highest_bookings_location' => $this->topLocation($rows, 'bookings_count'),
            ],
            'locations' => $rows->all(),
            'rankings' => [
                'revenue' => $this->ranking($rows, 'revenue_cents'),
                'bookings' => $this->ranking($rows, 'bookings_count'),
                'staff' => $this->ranking($rows, 'active_staff_count'),
                'services' => $this->ranking($rows, 'services_count'),
            ],
        ];
    }

    /** @return array<string, mixed> */
    private function locationMetrics(Location $location, ReportFilters $filters): array
    {
        $appointments = Appointment::query()
            ->withoutGlobalScope('tenant')
            ->where('tenant_id', $location->tenant_id)
            ->where('location_id', $location->id)
            ->whereBetween('starts_at', [$filters->from, $filters->to]);

        if ($filters->staffMemberId) {
            $appointments->where('staff_member_id', $filters->staffMemberId);
        }

        if ($filters->serviceId) {
            $appointments->where('service_id', $filters->serviceId);
        }

        if ($filters->status) {
            $appointments->where('status', $filters->status);
        }

        $bookingsCount = (clone $appointments)->count();
        $completedCount = (clone $appointments)->where('status', 'completed')->count();
        $activeStaffCount = (clone $appointments)->whereNotNull('staff_member_id')->distinct('staff_member_id')->count('staff_member_id');
        $servicesCount = (clone $appointments)->whereNotNull('service_id')->distinct('service_id')->count('service_id');

        $appointmentRevenue = PaymentTransaction::query()
            ->withoutGlobalScope('tenant')
            ->join('appointments', 'appointments.id', '=', 'payment_transactions.appointment_id')
            ->where('payment_transactions.tenant_id', $location->tenant_id)
            ->where('payment_transactions.status', 'paid')
            ->whereBetween('payment_transactions.paid_at', [$filters->from, $filters->to])
            ->where('appointments.location_id', $location->id)
            ->when($filters->staffMemberId, fn ($q) => $q->where('appointments.staff_member_id', $filters->staffMemberId))
            ->when($filters->serviceId, fn ($q) => $q->where('appointments.service_id', $filters->serviceId))
            ->sum('payment_transactions.amount_cents');

        $posRevenue = Sale::query()
            ->withoutGlobalScope('tenant')
            ->where('tenant_id', $location->tenant_id)
            ->where('location_id', $location->id)
            ->where('status', 'completed')
            ->whereBetween('completed_at', [$filters->from, $filters->to])
            ->when($filters->serviceId, function ($q) use ($filters) {
                $q->whereHas('items', fn ($items) => $items
                    ->where('item_type', 'service')
                    ->where('service_id', $filters->serviceId));
            })
            ->whereDoesntHave('payment', fn ($q) => $q->where('status', 'paid'))
            ->sum('total_cents');

        return [
            'revenue_cents' => (int) $appointmentRevenue + (int) $posRevenue,
            'bookings_count' => (int) $bookingsCount,
            'completed_bookings_count' => (int) $completedCount,
            'active_staff_count' => (int) $activeStaffCount,
            'services_count' => (int) $servicesCount,
            'top_staff' => $this->topStaff($location->tenant_id, $location->id, $filters),
            'top_services' => $this->topServices($location->tenant_id, $location->id, $filters),
            'revenue_by_day' => $this->revenueByDay($location->tenant_id, $location->id, $filters),
        ];
    }

    /** @return array<string, mixed>|null */
    private function topLocation(Collection $rows, string $metricKey): ?array
    {
        $top = $rows->sortByDesc(fn (array $row) => $row['metrics'][$metricKey] ?? 0)->first();

        return $top ? [
            'uuid' => $top['location']['uuid'],
            'name' => $top['location']['name'],
            $metricKey => $top['metrics'][$metricKey] ?? 0,
        ] : null;
    }

    /** @return list<array<string, mixed>> */
    private function ranking(Collection $rows, string $metricKey): array
    {
        return $rows
            ->sortByDesc(fn (array $row) => $row['metrics'][$metricKey] ?? 0)
            ->values()
            ->map(fn (array $row, int $index) => [
                'rank' => $index + 1,
                'uuid' => $row['location']['uuid'],
                'name' => $row['location']['name'],
                $metricKey => $row['metrics'][$metricKey] ?? 0,
            ])
            ->all();
    }

    /** @return list<array<string, mixed>> */
    private function topStaff(int $tenantId, int $locationId, ReportFilters $filters): array
    {
        return Appointment::query()
            ->withoutGlobalScope('tenant')
            ->join('staff_members', 'staff_members.id', '=', 'appointments.staff_member_id')
            ->leftJoin('services', 'services.id', '=', 'appointments.service_id')
            ->where('appointments.tenant_id', $tenantId)
            ->where('appointments.location_id', $locationId)
            ->whereBetween('appointments.starts_at', [$filters->from, $filters->to])
            ->when($filters->serviceId, fn ($q) => $q->where('appointments.service_id', $filters->serviceId))
            ->groupBy('appointments.staff_member_id', 'staff_members.uuid', 'staff_members.display_name')
            ->select(
                'staff_members.uuid',
                'staff_members.display_name',
                DB::raw('COUNT(*) as bookings_count'),
                DB::raw('COALESCE(SUM(services.price_cents), 0) as revenue_cents')
            )
            ->orderByDesc('revenue_cents')
            ->limit(5)
            ->get()
            ->map(fn ($row) => [
                'uuid' => $row->uuid,
                'display_name' => $row->display_name,
                'bookings_count' => (int) $row->bookings_count,
                'revenue_cents' => (int) $row->revenue_cents,
            ])
            ->all();
    }

    /** @return list<array<string, mixed>> */
    private function topServices(int $tenantId, int $locationId, ReportFilters $filters): array
    {
        return Appointment::query()
            ->withoutGlobalScope('tenant')
            ->join('services', 'services.id', '=', 'appointments.service_id')
            ->where('appointments.tenant_id', $tenantId)
            ->where('appointments.location_id', $locationId)
            ->whereBetween('appointments.starts_at', [$filters->from, $filters->to])
            ->when($filters->staffMemberId, fn ($q) => $q->where('appointments.staff_member_id', $filters->staffMemberId))
            ->groupBy('appointments.service_id', 'services.uuid', 'services.name')
            ->select(
                'services.uuid',
                'services.name',
                DB::raw('COUNT(*) as bookings_count'),
                DB::raw('COALESCE(SUM(services.price_cents), 0) as revenue_cents')
            )
            ->orderByDesc('revenue_cents')
            ->limit(5)
            ->get()
            ->map(fn ($row) => [
                'uuid' => $row->uuid,
                'name' => $row->name,
                'bookings_count' => (int) $row->bookings_count,
                'revenue_cents' => (int) $row->revenue_cents,
            ])
            ->all();
    }

    /** @return list<array<string, mixed>> */
    private function revenueByDay(int $tenantId, int $locationId, ReportFilters $filters): array
    {
        $days = [];
        $cursor = $filters->from->copy()->startOfDay();
        $end = $filters->to->copy()->startOfDay();

        $sales = Sale::query()
            ->withoutGlobalScope('tenant')
            ->where('tenant_id', $tenantId)
            ->where('location_id', $locationId)
            ->where('status', 'completed')
            ->whereBetween('completed_at', [$filters->from, $filters->to])
            ->select(DB::raw('DATE(completed_at) as date'), DB::raw('SUM(total_cents) as revenue_cents'))
            ->groupBy('date')
            ->pluck('revenue_cents', 'date');

        while ($cursor->lte($end)) {
            $date = $cursor->toDateString();
            $days[] = [
                'date' => $date,
                'label' => Carbon::parse($date)->format('M j'),
                'revenue_cents' => (int) ($sales[$date] ?? 0),
            ];
            $cursor->addDay();
        }

        return $days;
    }
}
