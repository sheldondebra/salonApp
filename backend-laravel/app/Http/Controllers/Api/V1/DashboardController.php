<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\AppointmentResource;
use App\Enums\UserType;
use App\Models\Appointment;
use App\Models\User;
use App\Support\TenantContext;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
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
            ->where('tenant_id', $tenantId)
            ->where('starts_at', '>=', $startOfMonth)
            ->whereIn('status', ['confirmed', 'completed'])
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

        $newCustomersMonth = User::query()
            ->where('user_type', UserType::Client)
            ->whereHas('tenants', function ($q) use ($tenantId, $startOfMonth) {
                $q->where('tenants.id', $tenantId)
                    ->where('tenant_user.joined_at', '>=', $startOfMonth);
            })
            ->count();

        return response()->json([
            'stats' => [
                'appointments_today' => $todayAppointments,
                'revenue_month_cents' => (int) $monthRevenue,
                'pending_bookings' => $pending,
                'completed_month' => $completedMonth,
                'new_customers_month' => $newCustomersMonth,
            ],
        ]);
    }

    public function revenueChart(): JsonResponse
    {
        $this->authorize('viewAnalytics');

        $tenantId = TenantContext::id();
        $start = Carbon::now()->subDays(6)->startOfDay();

        $rows = Appointment::withoutGlobalScope('tenant')
            ->where('appointments.tenant_id', $tenantId)
            ->where('appointments.starts_at', '>=', $start)
            ->whereIn('appointments.status', ['confirmed', 'completed'])
            ->join('services', 'appointments.service_id', '=', 'services.id')
            ->select(
                DB::raw('DATE(appointments.starts_at) as date'),
                DB::raw('SUM(services.price_cents) as revenue_cents'),
                DB::raw('COUNT(*) as bookings')
            )
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        $data = collect(range(0, 6))->map(function ($offset) use ($start, $rows) {
            $date = $start->copy()->addDays($offset)->toDateString();
            $row = $rows->firstWhere('date', $date);

            return [
                'date' => $date,
                'label' => Carbon::parse($date)->format('D'),
                'revenue_cents' => (int) ($row->revenue_cents ?? 0),
                'bookings' => (int) ($row->bookings ?? 0),
            ];
        });

        return response()->json(['data' => $data]);
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
