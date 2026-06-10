<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\RebookingRule;
use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class RebookingRuleService
{
    public function paginate(int $tenantId, array $filters = [], int $perPage = 20): LengthAwarePaginator
    {
        $query = RebookingRule::query()
            ->where('tenant_id', $tenantId)
            ->with(['service:id,uuid,name', 'staffMember:id,uuid,display_name'])
            ->latest();

        if (array_key_exists('is_active', $filters) && $filters['is_active'] !== null) {
            $query->whereBool('is_active', (bool) $filters['is_active']);
        }

        return $query->paginate(min($perPage, 50));
    }

    public function create(int $tenantId, array $data): RebookingRule
    {
        return RebookingRule::query()->create(array_merge($data, [
            'tenant_id' => $tenantId,
        ]))->fresh(['service', 'staffMember']);
    }

    public function update(RebookingRule $rule, array $data): RebookingRule
    {
        $rule->update($data);

        return $rule->fresh(['service', 'staffMember']);
    }

    public function delete(RebookingRule $rule): void
    {
        $rule->delete();
    }

    /** @return list<array<string, mixed>> */
    public function suggestions(int $tenantId): array
    {
        $rules = RebookingRule::query()
            ->where('tenant_id', $tenantId)
            ->whereBool('is_active', true)
            ->with(['service:id,uuid,name', 'staffMember:id,uuid,display_name'])
            ->get();

        return $rules->flatMap(function (RebookingRule $rule) use ($tenantId) {
            return $this->suggestionsForRule($tenantId, $rule);
        })->sortByDesc('days_since_last_visit')->values()->all();
    }

    /** @return array<string, mixed> */
    public function formatRule(RebookingRule $rule): array
    {
        return [
            'uuid' => $rule->uuid,
            'name' => $rule->name,
            'service_id' => $rule->service_id,
            'staff_member_id' => $rule->staff_member_id,
            'days_after_visit' => (int) $rule->days_after_visit,
            'auto_send_reminder' => (bool) $rule->auto_send_reminder,
            'is_active' => (bool) $rule->is_active,
            'service' => $rule->service ? [
                'uuid' => $rule->service->uuid,
                'name' => $rule->service->name,
            ] : null,
            'staff_member' => $rule->staffMember ? [
                'uuid' => $rule->staffMember->uuid,
                'display_name' => $rule->staffMember->display_name,
            ] : null,
            'updated_at' => $rule->updated_at?->toIso8601String(),
        ];
    }

    /** @return Collection<int, array<string, mixed>> */
    private function suggestionsForRule(int $tenantId, RebookingRule $rule): Collection
    {
        $rows = Appointment::query()
            ->withoutGlobalScope('tenant')
            ->join('users', 'users.id', '=', 'appointments.client_user_id')
            ->where('appointments.tenant_id', $tenantId)
            ->where('appointments.status', 'completed')
            ->whereNotNull('appointments.client_user_id')
            ->when($rule->service_id, fn ($q) => $q->where('appointments.service_id', $rule->service_id))
            ->when($rule->staff_member_id, fn ($q) => $q->where('appointments.staff_member_id', $rule->staff_member_id))
            ->groupBy('appointments.client_user_id', 'users.name', 'users.email')
            ->select(
                'appointments.client_user_id',
                'users.name',
                'users.email',
                DB::raw('MAX(appointments.starts_at) as last_visit_at')
            )
            ->get();

        return $rows->map(function ($row) use ($rule) {
            $lastVisit = Carbon::parse($row->last_visit_at);
            $daysSince = $lastVisit->diffInDays(now());
            if ($daysSince < (int) $rule->days_after_visit) {
                return null;
            }

            return [
                'rule_uuid' => $rule->uuid,
                'rule_name' => $rule->name,
                'client_user_id' => $row->client_user_id,
                'client_name' => $row->name,
                'client_email' => $row->email,
                'service_name' => $rule->service?->name,
                'staff_name' => $rule->staffMember?->display_name,
                'last_visit_at' => $lastVisit->toIso8601String(),
                'days_since_last_visit' => $daysSince,
                'recommended_send_at' => $lastVisit->copy()->addDays((int) $rule->days_after_visit)->toIso8601String(),
            ];
        })->filter();
    }
}
