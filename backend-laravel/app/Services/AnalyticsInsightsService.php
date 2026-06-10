<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\StaffWorkingHour;
use App\Models\User;
use App\Support\ReportFilters;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class AnalyticsInsightsService
{
    public function dashboard(int $tenantId, ReportFilters $filters): array
    {
        return [
            'occupancy_utilization' => $this->occupancyUtilization($tenantId, $filters),
            'retention_churn' => $this->retentionChurn($tenantId, $filters),
        ];
    }

    public function occupancyUtilization(int $tenantId, ReportFilters $filters): array
    {
        $appointments = Appointment::query()
            ->withoutGlobalScope('tenant')
            ->where('tenant_id', $tenantId)
            ->whereBetween('starts_at', [$filters->from, $filters->to])
            ->when($filters->locationId, fn ($q) => $q->where('location_id', $filters->locationId))
            ->when($filters->staffMemberId, fn ($q) => $q->where('staff_member_id', $filters->staffMemberId))
            ->whereNotIn('status', ['cancelled', 'no_show'])
            ->get(['staff_member_id', 'location_id', 'starts_at', 'ends_at']);

        $bookedMinutes = (int) $appointments->sum(fn (Appointment $appointment) => $appointment->starts_at && $appointment->ends_at
            ? $appointment->starts_at->diffInMinutes($appointment->ends_at)
            : 0);

        $workingMinutes = (int) StaffWorkingHour::query()
            ->withoutGlobalScope('tenant')
            ->where('tenant_id', $tenantId)
            ->when($filters->locationId, fn ($q) => $q->where('location_id', $filters->locationId))
            ->when($filters->staffMemberId, fn ($q) => $q->where('staff_member_id', $filters->staffMemberId))
            ->whereBool('is_working_day')
            ->get()
            ->sum(function (StaffWorkingHour $hour) use ($filters) {
                if (! $hour->start_time || ! $hour->end_time) {
                    return 0;
                }

                $dayCount = $this->dayOccurrencesWithinRange((int) $hour->day_of_week, $filters->from, $filters->to);
                return $dayCount * $this->minutesBetween($hour->startTimeHi(), $hour->endTimeHi());
            });

        return [
            'booked_minutes' => $bookedMinutes,
            'available_minutes' => $workingMinutes,
            'utilization_percent' => $workingMinutes > 0 ? round(($bookedMinutes / $workingMinutes) * 100, 2) : 0,
            'appointments_count' => $appointments->count(),
        ];
    }

    public function retentionChurn(int $tenantId, ReportFilters $filters): array
    {
        $rows = Appointment::query()
            ->withoutGlobalScope('tenant')
            ->where('tenant_id', $tenantId)
            ->whereBetween('starts_at', [$filters->from, $filters->to])
            ->whereNotNull('client_user_id')
            ->whereNotIn('status', ['cancelled', 'no_show'])
            ->select('client_user_id', DB::raw('COUNT(*) as visits'))
            ->groupBy('client_user_id')
            ->get();

        $returning = $rows->where('visits', '>', 1)->count();
        $new = $rows->where('visits', 1)->count();
        $churnRisk = $this->churnRiskClients($tenantId, $filters);

        return [
            'active_clients' => $rows->count(),
            'new_clients' => $new,
            'returning_clients' => $returning,
            'average_visit_frequency' => round((float) $rows->avg('visits'), 2),
            'churn_risk_clients' => $churnRisk,
        ];
    }

    private function churnRiskClients(int $tenantId, ReportFilters $filters): array
    {
        $cutoff = $filters->to->copy()->subDays(60);

        return User::query()
            ->whereHas('clientAppointments', function ($q) use ($tenantId, $cutoff) {
                $q->withoutGlobalScope('tenant')
                    ->where('tenant_id', $tenantId)
                    ->groupBy('client_user_id')
                    ->havingRaw('MAX(starts_at) < ?', [$cutoff]);
            })
            ->limit(20)
            ->get(['id', 'name', 'email'])
            ->map(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ])
            ->all();
    }

    private function minutesBetween(?string $start, ?string $end): int
    {
        if (! $start || ! $end) {
            return 0;
        }

        return Carbon::createFromFormat('H:i', $start)->diffInMinutes(Carbon::createFromFormat('H:i', $end));
    }

    private function dayOccurrencesWithinRange(int $dayOfWeekIso, Carbon $from, Carbon $to): int
    {
        $count = 0;
        $cursor = $from->copy()->startOfDay();
        $end = $to->copy()->startOfDay();

        while ($cursor->lte($end)) {
            if ($cursor->dayOfWeekIso === $dayOfWeekIso) {
                $count++;
            }

            $cursor->addDay();
        }

        return $count;
    }

    public function occupancyDashboard(int $tenantId, ReportFilters $filters): array
    {
        $base = $this->occupancyUtilization($tenantId, $filters);
        $timeline = [];
        $cursor = $filters->from->copy()->startOfDay();
        $end = $filters->to->copy()->startOfDay();
        $peak = ['label' => null, 'percent' => -1];
        $low = ['label' => null, 'percent' => 101];

        while ($cursor->lte($end)) {
            $dayFilters = new ReportFilters(
                tenantId: $tenantId,
                from: $cursor->copy()->startOfDay(),
                to: $cursor->copy()->endOfDay(),
                locationId: $filters->locationId,
                staffMemberId: $filters->staffMemberId,
            );
            $day = $this->occupancyUtilization($tenantId, $dayFilters);
            $percent = (float) ($day['utilization_percent'] ?? 0);
            $label = $cursor->format('D M j');
            $timeline[] = [
                'date' => $cursor->toDateString(),
                'label' => $label,
                'occupancy_percent' => $percent,
                'available_hours' => round(($day['available_minutes'] ?? 0) / 60, 1),
                'booked_hours' => round(($day['booked_minutes'] ?? 0) / 60, 1),
            ];
            if ($percent > $peak['percent']) {
                $peak = ['label' => $label, 'percent' => $percent];
            }
            if ($percent < $low['percent']) {
                $low = ['label' => $label, 'percent' => $percent];
            }
            $cursor->addDay();
        }

        return [
            'summary' => [
                'average_occupancy_percent' => (float) ($base['utilization_percent'] ?? 0),
                'peak_day_label' => $peak['label'],
                'lowest_day_label' => $low['label'],
                'utilization_hours' => round(($base['booked_minutes'] ?? 0) / 60, 1),
            ],
            'timeline' => $timeline,
            'by_day' => collect($timeline)->map(fn ($row) => [
                'label' => $row['label'],
                'occupancy_percent' => $row['occupancy_percent'],
            ])->values()->all(),
        ];
    }

    public function retentionDashboard(int $tenantId, ReportFilters $filters): array
    {
        $base = $this->retentionChurn($tenantId, $filters);
        $active = max(1, (int) ($base['active_clients'] ?? 0));
        $returning = (int) ($base['returning_clients'] ?? 0);
        $retentionPercent = round(($returning / $active) * 100, 1);

        return [
            'summary' => [
                'retention_percent' => $retentionPercent,
                'repeat_clients' => $returning,
                'lapsed_clients' => count($base['churn_risk_clients'] ?? []),
                'average_days_between_visits' => (int) round(30 / max(1, (float) ($base['average_visit_frequency'] ?? 1))),
            ],
            'timeline' => [
                ['label' => 'New', 'retained_percent' => round(((int) ($base['new_clients'] ?? 0) / $active) * 100, 1)],
                ['label' => 'Returning', 'retained_percent' => $retentionPercent],
            ],
            'segments' => [
                ['label' => 'Active clients', 'clients' => (int) ($base['active_clients'] ?? 0)],
                ['label' => 'New clients', 'clients' => (int) ($base['new_clients'] ?? 0)],
                ['label' => 'Returning clients', 'clients' => $returning],
                ['label' => 'Churn risk', 'clients' => count($base['churn_risk_clients'] ?? [])],
            ],
            'churn_risk_clients' => $base['churn_risk_clients'] ?? [],
        ];
    }
}
