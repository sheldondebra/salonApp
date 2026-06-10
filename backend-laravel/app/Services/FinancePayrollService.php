<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\Sale;
use App\Models\StaffMember;
use App\Models\StaffPayrollProfile;
use App\Models\User;
use App\Support\PermissionChecker;
use Carbon\Carbon;

class FinancePayrollService
{
    /**
     * @param  array<string, mixed>  $filters
     * @return array{summary: array<string, mixed>, staff: list<array<string, mixed>>, filters: array<string, mixed>}
     */
    public function summary(int $tenantId, array $filters, ?User $user = null): array
    {
        $from = isset($filters['from'])
            ? Carbon::parse((string) $filters['from'])->startOfDay()
            : now()->startOfMonth();
        $to = isset($filters['to'])
            ? Carbon::parse((string) $filters['to'])->endOfDay()
            : now()->endOfDay();

        $staffQuery = StaffMember::query()
            ->where('tenant_id', $tenantId)
            ->whereBool('is_active', true)
            ->with(['user:id,name,email', 'payrollProfile.payRole']);

        $restrictedStaffId = $this->restrictedStaffMemberId($tenantId, $user);
        if ($restrictedStaffId) {
            $staffQuery->where('id', $restrictedStaffId);
        }

        if (! empty($filters['staff_member_id'])) {
            $staffQuery->where('id', (int) $filters['staff_member_id']);
        }

        $staffMembers = $staffQuery->orderBy('display_name')->get();

        $commissionByStaff = $this->commissionTotals($tenantId, $from, $to);
        $tipsByStaff = $this->tipsTotals($tenantId, $from, $to);

        $rows = $staffMembers->map(function (StaffMember $staff) use ($from, $to, $commissionByStaff, $tipsByStaff) {
            $profile = $staff->payrollProfile ?? app(StaffPayrollService::class)->profileForStaff($staff);
            $baseCents = $this->proratedBasePayCents($profile, $from, $to);
            $commissionCents = (int) ($commissionByStaff[$staff->id] ?? 0);
            $tipsOwedCents = $profile->tip_eligible
                ? (int) ($tipsByStaff[$staff->id] ?? 0)
                : 0;
            $totalCents = $baseCents + $commissionCents + $tipsOwedCents;

            return [
                'staff_member_id' => $staff->id,
                'staff_name' => $staff->display_name,
                'job_title' => $staff->title,
                'pay_type' => $profile->pay_type,
                'pay_role_name' => $profile->payRole?->name,
                'commission_rate' => (float) $profile->commission_rate,
                'tip_eligible' => (bool) $profile->tip_eligible,
                'base_pay_cents' => $baseCents,
                'commission_cents' => $commissionCents,
                'tips_owed_cents' => $tipsOwedCents,
                'total_earnings_cents' => $totalCents,
                'approval_status' => 'estimated',
                'profile_active' => (bool) $profile->is_active,
            ];
        })->values()->all();

        $summary = [
            'staff_count' => count($rows),
            'base_pay_cents' => (int) collect($rows)->sum('base_pay_cents'),
            'commission_cents' => (int) collect($rows)->sum('commission_cents'),
            'tips_owed_cents' => (int) collect($rows)->sum('tips_owed_cents'),
            'total_payroll_cents' => (int) collect($rows)->sum('total_earnings_cents'),
        ];

        return [
            'filters' => [
                'from' => $from->toDateString(),
                'to' => $to->toDateString(),
                'staff_member_id' => $filters['staff_member_id'] ?? null,
            ],
            'summary' => $summary,
            'staff' => $rows,
        ];
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return list<array<string, mixed>>
     */
    public function exportRows(int $tenantId, array $filters, ?User $user = null): array
    {
        return $this->summary($tenantId, $filters, $user)['staff'];
    }

    protected function restrictedStaffMemberId(int $tenantId, ?User $user): ?int
    {
        if (! $user) {
            return null;
        }

        if (
            PermissionChecker::allows($user, 'finance.view')
            || PermissionChecker::allows($user, 'finance.payroll.view')
        ) {
            return null;
        }

        if (! PermissionChecker::allows($user, 'finance.payroll.view_self')) {
            return null;
        }

        return StaffMember::query()
            ->where('tenant_id', $tenantId)
            ->where('user_id', $user->id)
            ->value('id');
    }

    protected function proratedBasePayCents(StaffPayrollProfile $profile, Carbon $from, Carbon $to): int
    {
        if ($profile->pay_type !== 'salary' || (int) $profile->base_salary_cents <= 0) {
            return 0;
        }

        $daysInRange = max(1, $from->copy()->startOfDay()->diffInDays($to->copy()->startOfDay()) + 1);
        $daysInMonth = max(1, $to->daysInMonth);

        return (int) round(((int) $profile->base_salary_cents) * ($daysInRange / $daysInMonth));
    }

    /**
     * @return array<int, int>
     */
    protected function commissionTotals(int $tenantId, Carbon $from, Carbon $to): array
    {
        $profiles = StaffPayrollProfile::query()
            ->where('tenant_id', $tenantId)
            ->whereBool('is_active', true)
            ->where('commission_rate', '>', 0)
            ->get()
            ->keyBy('staff_member_id');

        if ($profiles->isEmpty()) {
            return [];
        }

        $appointments = Appointment::query()
            ->where('tenant_id', $tenantId)
            ->where('status', 'completed')
            ->whereNotNull('staff_member_id')
            ->whereBetween('starts_at', [$from, $to])
            ->get(['id', 'staff_member_id', 'amount_due_cents']);

        $totals = [];

        foreach ($appointments as $appointment) {
            $profile = $profiles->get($appointment->staff_member_id);
            if (! $profile) {
                continue;
            }

            $base = max(0, (int) $appointment->amount_due_cents);
            $commission = (int) round($base * ((float) $profile->commission_rate / 100));
            $totals[$appointment->staff_member_id] = ($totals[$appointment->staff_member_id] ?? 0) + $commission;
        }

        return $totals;
    }

    /**
     * @return array<int, int>
     */
    protected function tipsTotals(int $tenantId, Carbon $from, Carbon $to): array
    {
        $sales = Sale::query()
            ->where('tenant_id', $tenantId)
            ->where('status', 'completed')
            ->where('tip_cents', '>', 0)
            ->whereBetween('completed_at', [$from, $to])
            ->whereNotNull('appointment_id')
            ->with('appointment:id,staff_member_id')
            ->get(['id', 'tip_cents', 'appointment_id']);

        $totals = [];

        foreach ($sales as $sale) {
            $staffId = $sale->appointment?->staff_member_id;
            if (! $staffId) {
                continue;
            }
            $totals[$staffId] = ($totals[$staffId] ?? 0) + (int) $sale->tip_cents;
        }

        return $totals;
    }
}
