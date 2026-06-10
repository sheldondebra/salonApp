<?php

namespace App\Services;

use App\Models\StaffMember;
use App\Models\StaffPayRole;
use App\Models\StaffPayrollProfile;

class StaffPayrollService
{
    public function maskAccount(?string $value): ?string
    {
        if (! filled($value)) {
            return null;
        }

        $len = strlen($value);
        if ($len <= 4) {
            return str_repeat('•', 6);
        }

        return str_repeat('•', min(12, max(6, $len - 4)).substr($value, -4);
    }

    public function profileForStaff(StaffMember $staff): StaffPayrollProfile
    {
        return StaffPayrollProfile::query()->firstOrCreate(
            [
                'tenant_id' => $staff->tenant_id,
                'staff_member_id' => $staff->id,
            ],
            [
                'pay_type' => 'salary',
                'base_salary_cents' => 0,
                'hourly_rate_cents' => 0,
                'commission_rate' => 0,
                'tip_eligible' => true,
                'is_active' => true,
            ]
        );
    }

    /** @return array<string, mixed> */
    public function profilePayload(StaffPayrollProfile $profile): array
    {
        $profile->loadMissing('payRole');

        return [
            'id' => $profile->id,
            'staff_member_id' => $profile->staff_member_id,
            'pay_role_id' => $profile->pay_role_id,
            'pay_type' => $profile->pay_type,
            'base_salary_cents' => $profile->base_salary_cents,
            'hourly_rate_cents' => $profile->hourly_rate_cents,
            'commission_rate' => (float) $profile->commission_rate,
            'commission_type' => $profile->commission_type,
            'tip_eligible' => $profile->tip_eligible,
            'payout_method' => $profile->payout_method,
            'payout_account_name' => $profile->payout_account_name,
            'payout_account_number_masked' => $this->maskAccount($profile->payout_account_number),
            'has_payout_account_number' => filled($profile->payout_account_number),
            'effective_from' => $profile->effective_from?->toDateString(),
            'notes' => $profile->notes,
            'is_active' => $profile->is_active,
            'pay_role' => $profile->payRole ? $this->rolePayload($profile->payRole) : null,
            'updated_at' => $profile->updated_at?->toIso8601String(),
        ];
    }

    /** @return array<string, mixed> */
    public function rolePayload(StaffPayRole $role): array
    {
        return [
            'id' => $role->id,
            'name' => $role->name,
            'description' => $role->description,
            'pay_type' => $role->pay_type,
            'base_salary_cents' => $role->base_salary_cents,
            'hourly_rate_cents' => $role->hourly_rate_cents,
            'commission_rate' => (float) $role->commission_rate,
            'commission_type' => $role->commission_type,
            'tip_eligible' => $role->tip_eligible,
            'color' => $role->color,
            'sort_order' => $role->sort_order,
            'is_active' => $role->is_active,
            'staff_count' => $role->payrollProfiles()->count(),
        ];
    }

    /** @param  array<string, mixed>  $data */
    public function updateProfile(StaffPayrollProfile $profile, array $data): StaffPayrollProfile
    {
        if (array_key_exists('pay_role_id', $data)) {
            $profile->pay_role_id = $data['pay_role_id'] ?: null;
            if ($profile->pay_role_id) {
                $role = StaffPayRole::query()
                    ->where('tenant_id', $profile->tenant_id)
                    ->find($profile->pay_role_id);
                if ($role) {
                    $this->applyRoleDefaults($profile, $role, false);
                }
            }
        }

        foreach ([
            'pay_type',
            'base_salary_cents',
            'hourly_rate_cents',
            'commission_rate',
            'commission_type',
            'tip_eligible',
            'payout_method',
            'payout_account_name',
            'effective_from',
            'notes',
            'is_active',
        ] as $field) {
            if (array_key_exists($field, $data)) {
                $profile->{$field} = $data[$field];
            }
        }

        if (array_key_exists('payout_account_number', $data) && filled($data['payout_account_number'])) {
            $profile->payout_account_number = trim((string) $data['payout_account_number']);
        }

        $profile->save();

        return $profile->fresh(['payRole']);
    }

    public function applyRoleDefaults(StaffPayrollProfile $profile, StaffPayRole $role, bool $save = true): StaffPayrollProfile
    {
        $profile->pay_role_id = $role->id;
        $profile->pay_type = $role->pay_type;
        $profile->base_salary_cents = $role->base_salary_cents;
        $profile->hourly_rate_cents = $role->hourly_rate_cents;
        $profile->commission_rate = $role->commission_rate;
        $profile->commission_type = $role->commission_type;
        $profile->tip_eligible = $role->tip_eligible;

        if ($save) {
            $profile->save();
        }

        return $profile;
    }
}
