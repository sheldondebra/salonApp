<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\AppointmentResource;
use App\Enums\UserType;
use App\Models\Appointment;
use App\Models\Sale;
use App\Models\User;
use App\Services\InventoryService;
use App\Support\TenantContext;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function __construct(
        protected InventoryService $inventory,
    ) {}

    public function stats(): JsonResponse
    {
        $this->authorize('viewAnalytics');

        $tenantId = TenantContext::id();
        $today = Carbon::today();
        $startOfMonth = Carbon::now()->startOfMonth();

        $todayAppointments = Appointment::withoutGlobalScope('tenant')
            ->where('tenant_id', $tenantId)
            ->whereDate('starts_at', $today)
            ->count();

        $monthRevenue = Appointment::withoutGlobalScope('tenant')
            ->where('appointments.tenant_id', $tenantId)
            ->where('appointments.starts_at', '>=', $startOfMonth)
            ->whereIn('appointments.status', ['confirmed', 'completed'])
            ->join('services', 'appointments.service_id', '=', 'services.id')
            ->sum('services.price_cents');

        $pending = Appointment::withoutGlobalScope('tenant')
            ->where('tenant_id', $tenantId)
            ->where('status', 'pending')
            ->count();

        $completedMonth = Appointment::withoutGlobalScope('tenant')
            ->where('tenant_id', $tenantId)
            ->where('status', 'completed')
            ->where('starts_at', '>=', $startOfMonth)
            ->count();

        $cancelledMonth = Appointment::withoutGlobalScope('tenant')
            ->where('tenant_id', $tenantId)
            ->where('status', 'cancelled')
            ->where('starts_at', '>=', $startOfMonth)
            ->count();

        $selfBookingsMonth = Appointment::withoutGlobalScope('tenant')
            ->where('tenant_id', $tenantId)
            ->where('booked_via', 'online')
            ->where('starts_at', '>=', $startOfMonth)
            ->count();

        $newCustomersMonth = User::query()
            ->where('user_type', UserType::Client)
            ->whereHas('tenants', function ($q) use ($tenantId, $startOfMonth) {
                $q->where('tenants.id', $tenantId)
                    ->where('tenant_user.joined_at', '>=', $startOfMonth);
            })
            ->count();

        $posMonth = Sale::query()
            ->where('tenant_id', $tenantId)
            ->where('status', 'completed')
            ->where('completed_at', '>=', $startOfMonth);

        $posToday = (clone $posMonth)->whereDate('completed_at', $today);

        $inventorySummary = $this->inventory->dashboardSummary($tenantId);

        return response()->json([
            'stats' => [
                'appointments_today' => $todayAppointments,
                'revenue_month_cents' => (int) $monthRevenue,
                'pending_bookings' => $pending,
                'completed_month' => $completedMonth,
                'cancelled_month' => $cancelledMonth,
                'self_bookings_month' => $selfBookingsMonth,
                'new_customers_month' => $newCustomersMonth,
                'pos_sales_today_count' => (clone $posToday)->count(),
                'pos_sales_today_cents' => (int) (clone $posToday)->sum('total_cents'),
                'pos_sales_month_cents' => (int) (clone $posMonth)->sum('total_cents'),
                'active_products' => $inventorySummary['active_products'],
                'low_stock_count' => $inventorySummary['low_stock_count'],
            ],
        ]);
    }

    public function revenueChart(Request $request): JsonResponse
    {
        return $this->growthChart($request);
    }

    public function growthChart(Request $request): JsonResponse
    {
        $this->authorize('viewAnalytics');

        $days = min(max((int) $request->integer('days', 30), 7), 90);
        $tenantId = TenantContext::id();
        $start = Carbon::now()->subDays($days - 1)->startOfDay();

        $revenueRows = Appointment::withoutGlobalScope('tenant')
            ->where('appointments.tenant_id', $tenantId)
            ->where('appointments.starts_at', '>=', $start)
            ->whereIn('appointments.status', ['confirmed', 'completed'])
            ->join('services', 'appointments.service_id', '=', 'services.id')
            ->select(
                DB::raw('DATE(appointments.starts_at) as date'),
                DB::raw('SUM(services.price_cents) as revenue_cents')
            )
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->keyBy('date');

        $statusRows = Appointment::withoutGlobalScope('tenant')
            ->where('tenant_id', $tenantId)
            ->where('starts_at', '>=', $start)
            ->select(
                DB::raw('DATE(starts_at) as date'),
                DB::raw("SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed"),
                DB::raw("SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled"),
                DB::raw("SUM(CASE WHEN booked_via = 'online' THEN 1 ELSE 0 END) as self_bookings"),
                DB::raw('COUNT(*) as bookings')
            )
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->keyBy('date');

        $data = collect(range(0, $days - 1))->map(function ($offset) use ($start, $revenueRows, $statusRows, $days) {
            $date = $start->copy()->addDays($offset)->toDateString();
            $revenue = $revenueRows->get($date);
            $status = $statusRows->get($date);

            return [
                'date' => $date,
                'label' => $days <= 14
                    ? Carbon::parse($date)->format('D')
                    : Carbon::parse($date)->format('M j'),
                'revenue_cents' => (int) ($revenue->revenue_cents ?? 0),
                'bookings' => (int) ($status->bookings ?? 0),
                'completed' => (int) ($status->completed ?? 0),
                'cancelled' => (int) ($status->cancelled ?? 0),
                'self_bookings' => (int) ($status->self_bookings ?? 0),
            ];
        });

        return response()->json(['data' => $data]);
    }

    public function bookingsBreakdown(): JsonResponse
    {
        $this->authorize('viewAnalytics');

        $tenantId = TenantContext::id();
        $startOfMonth = Carbon::now()->startOfMonth();

        $with = ['service', 'staffMember', 'client'];

        $cancelled = Appointment::query()
            ->with($with)
            ->where('starts_at', '>=', $startOfMonth)
            ->where('status', 'cancelled')
            ->orderByDesc('starts_at')
            ->limit(8)
            ->get();

        $completed = Appointment::query()
            ->with($with)
            ->where('starts_at', '>=', $startOfMonth)
            ->where('status', 'completed')
            ->orderByDesc('starts_at')
            ->limit(8)
            ->get();

        $selfBookings = Appointment::query()
            ->with($with)
            ->where('starts_at', '>=', $startOfMonth)
            ->where('booked_via', 'online')
            ->orderByDesc('starts_at')
            ->limit(8)
            ->get();

        return response()->json([
            'cancelled' => AppointmentResource::collection($cancelled),
            'completed' => AppointmentResource::collection($completed),
            'self_bookings' => AppointmentResource::collection($selfBookings),
        ]);
    }

    public function upcomingAppointments(): JsonResponse
    {
        $this->authorize('viewAnalytics');

        $appointments = Appointment::query()
            ->with(['service', 'staffMember', 'client'])
            ->where('starts_at', '>=', now())
            ->orderBy('starts_at')
            ->limit(10)
            ->get();

        return response()->json([
            'data' => AppointmentResource::collection($appointments),
        ]);
    }

    public function recentAppointments(): JsonResponse
    {
        $this->authorize('viewAnalytics');

        $appointments = Appointment::query()
            ->with(['service', 'staffMember', 'client'])
            ->where('starts_at', '<', now())
            ->orderByDesc('starts_at')
            ->limit(10)
            ->get();

        return response()->json([
            'data' => AppointmentResource::collection($appointments),
        ]);
    }
}
