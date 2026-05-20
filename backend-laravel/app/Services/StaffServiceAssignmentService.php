<?php

namespace App\Services;

use App\Models\StaffMember;
use App\Models\StaffService;
use App\Support\PgsqlBoolean;
use App\Support\TenantContext;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

class StaffServiceAssignmentService
{
    /**
     * Staff with no active assignments can perform any service.
     * Staff with assignments must cover every selected service.
     *
     * @param  list<int>  $serviceIds
     */
    public function applyBookableForServices(Builder $query, array $serviceIds): Builder
    {
        $serviceIds = array_values(array_unique(array_filter($serviceIds)));
        if ($serviceIds === []) {
            return $query;
        }

        return $query->where(function (Builder $outer) use ($serviceIds) {
            foreach ($serviceIds as $serviceId) {
                $outer->where(function (Builder $inner) use ($serviceId) {
                    $inner->whereDoesntHave('activeStaffServices')
                        ->orWhereHas('activeStaffServices', fn (Builder $s) => $s->where('service_id', $serviceId));
                });
            }
        });
    }

    /**
     * @param  list<int>  $serviceIds
     */
    public function staffCanPerformServices(int $staffMemberId, array $serviceIds): bool
    {
        $serviceIds = array_values(array_unique(array_filter($serviceIds)));
        if ($serviceIds === []) {
            return true;
        }

        return StaffMember::query()
            ->where('id', $staffMemberId)
            ->where(function (Builder $q) use ($serviceIds) {
                $this->applyBookableForServices($q, $serviceIds);
            })
            ->exists();
    }

    /**
     * @param  list<int>  $serviceIds
     */
    public function assertStaffCanPerformServices(?int $staffMemberId, array $serviceIds): void
    {
        if (! $staffMemberId || $serviceIds === []) {
            return;
        }

        if (! $this->staffCanPerformServices($staffMemberId, $serviceIds)) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'staff_member_id' => ['This team member cannot perform the selected service(s).'],
            ]);
        }
    }

    /**
     * @return Collection<int, StaffService>
     */
    public function syncBulk(StaffMember $staffMember, array $serviceIds, bool $replace = true): Collection
    {
        $serviceIds = array_values(array_unique(array_filter($serviceIds)));
        $tenantId = TenantContext::id() ?? $staffMember->tenant_id;

        if ($replace) {
            StaffService::query()
                ->where('staff_member_id', $staffMember->id)
                ->whereNotIn('service_id', $serviceIds)
                ->update(['is_active' => PgsqlBoolean::updateValue(false)]);
        }

        $rows = collect();
        foreach ($serviceIds as $serviceId) {
            $rows->push(
                StaffService::query()->updateOrCreate(
                    [
                        'staff_member_id' => $staffMember->id,
                        'service_id' => $serviceId,
                    ],
                    [
                        'tenant_id' => $tenantId,
                        'is_active' => true,
                    ]
                )
            );
        }

        return $rows;
    }
}
