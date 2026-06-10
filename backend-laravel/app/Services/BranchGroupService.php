<?php

namespace App\Services;

use App\Models\BranchGroup;
use App\Models\BranchSettingOverride;
use App\Models\Location;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class BranchGroupService
{
    public function paginateGroups(int $tenantId, int $perPage = 20): LengthAwarePaginator
    {
        return BranchGroup::query()
            ->where('tenant_id', $tenantId)
            ->with(['manager:id,name,email', 'locations:id,uuid,name,city'])
            ->latest()
            ->paginate(min($perPage, 50));
    }

    public function createGroup(int $tenantId, array $data): BranchGroup
    {
        $group = BranchGroup::query()->create([
            'tenant_id' => $tenantId,
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'manager_user_id' => $data['manager_user_id'] ?? null,
        ]);

        if (! empty($data['location_ids']) && is_array($data['location_ids'])) {
            $group->locations()->sync(array_map('intval', $data['location_ids']));
        }

        return $group->fresh(['manager', 'locations']);
    }

    public function updateGroup(BranchGroup $group, array $data): BranchGroup
    {
        $group->update([
            'name' => $data['name'] ?? $group->name,
            'description' => array_key_exists('description', $data) ? $data['description'] : $group->description,
            'manager_user_id' => array_key_exists('manager_user_id', $data) ? $data['manager_user_id'] : $group->manager_user_id,
        ]);

        if (array_key_exists('location_ids', $data) && is_array($data['location_ids'])) {
            $group->locations()->sync(array_map('intval', $data['location_ids']));
        }

        return $group->fresh(['manager', 'locations']);
    }

    public function deleteGroup(BranchGroup $group): void
    {
        $group->delete();
    }

    public function paginateOverrides(int $tenantId, int $perPage = 20): LengthAwarePaginator
    {
        return BranchSettingOverride::query()
            ->where('tenant_id', $tenantId)
            ->with('location:id,uuid,name,city')
            ->latest()
            ->paginate(min($perPage, 50));
    }

    public function saveOverride(int $tenantId, Location $location, array $data): BranchSettingOverride
    {
        return BranchSettingOverride::query()->updateOrCreate(
            [
                'tenant_id' => $tenantId,
                'location_id' => $location->id,
                'setting_key' => $data['setting_key'],
            ],
            [
                'value' => $data['value'] ?? null,
            ]
        )->fresh(['location']);
    }

    public function deleteOverride(BranchSettingOverride $override): void
    {
        $override->delete();
    }

    /** @return array<string, mixed> */
    public function formatGroup(BranchGroup $group): array
    {
        return [
            'uuid' => $group->uuid,
            'name' => $group->name,
            'description' => $group->description,
            'manager' => $group->manager ? [
                'id' => $group->manager->id,
                'name' => $group->manager->name,
                'email' => $group->manager->email,
            ] : null,
            'locations' => $group->locations->map(fn ($location) => [
                'uuid' => $location->uuid,
                'name' => $location->name,
                'city' => $location->city,
            ])->values()->all(),
        ];
    }

    /** @return array<string, mixed> */
    public function formatOverride(BranchSettingOverride $override): array
    {
        return [
            'id' => $override->id,
            'location_id' => $override->location_id,
            'setting_key' => $override->setting_key,
            'value' => $override->value,
            'location' => $override->location ? [
                'uuid' => $override->location->uuid,
                'name' => $override->location->name,
            ] : null,
            'updated_at' => $override->updated_at?->toIso8601String(),
        ];
    }
}
