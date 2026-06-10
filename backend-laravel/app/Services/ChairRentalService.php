<?php

namespace App\Services;

use App\Models\ChairRentalProfile;
use App\Models\StaffMember;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class ChairRentalService
{
    public function paginate(int $tenantId, int $perPage = 20): LengthAwarePaginator
    {
        return ChairRentalProfile::query()
            ->where('tenant_id', $tenantId)
            ->with('staffMember:id,uuid,display_name,employment_mode')
            ->latest()
            ->paginate(min($perPage, 50));
    }

    public function upsert(int $tenantId, StaffMember $staffMember, array $data): ChairRentalProfile
    {
        return ChairRentalProfile::query()->updateOrCreate(
            ['staff_member_id' => $staffMember->id],
            array_merge($data, [
                'tenant_id' => $tenantId,
                'staff_member_id' => $staffMember->id,
            ])
        )->fresh(['staffMember']);
    }

    public function delete(ChairRentalProfile $profile): void
    {
        $profile->delete();
    }

    /** @return array<string, mixed> */
    public function formatProfile(ChairRentalProfile $profile): array
    {
        return [
            'id' => $profile->id,
            'staff_member_id' => $profile->staff_member_id,
            'rental_fee_cents' => (int) $profile->rental_fee_cents,
            'billing_interval' => $profile->billing_interval?->value ?? $profile->billing_interval,
            'schedule' => $profile->schedule ?? [],
            'is_active' => (bool) $profile->is_active,
            'staff_member' => $profile->staffMember ? [
                'uuid' => $profile->staffMember->uuid,
                'display_name' => $profile->staffMember->display_name,
            ] : null,
        ];
    }
}
