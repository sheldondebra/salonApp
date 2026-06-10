<?php

namespace App\Services;

use App\Enums\StaffEmploymentMode;
use App\Models\StaffMember;

class SelfEmployedStaffService
{
    public function sync(StaffMember $staffMember, array $data): StaffMember
    {
        $settings = is_array($staffMember->self_employed_settings) ? $staffMember->self_employed_settings : [];
        $incoming = is_array($data['self_employed_settings'] ?? null) ? $data['self_employed_settings'] : [];

        $staffMember->update([
            'employment_mode' => $data['employment_mode'] ?? $staffMember->employment_mode ?? StaffEmploymentMode::Employed,
            'self_employed_settings' => array_merge($settings, $incoming),
        ]);

        return $staffMember->fresh();
    }

    /** @return array<string, mixed> */
    public function format(StaffMember $staffMember): array
    {
        return [
            'staff_member_uuid' => $staffMember->uuid,
            'employment_mode' => $staffMember->employment_mode?->value ?? $staffMember->employment_mode,
            'self_employed_settings' => $staffMember->self_employed_settings ?? [],
        ];
    }

    /** @return array<string, mixed> */
    public function workspaceProfile(StaffMember $staffMember): array
    {
        $settings = is_array($staffMember->self_employed_settings) ? $staffMember->self_employed_settings : [];

        return [
            'id' => $staffMember->id,
            'legal_name' => $settings['legal_name'] ?? null,
            'trading_name' => $settings['trading_name'] ?? null,
            'tax_id' => $settings['tax_id'] ?? null,
            'vat_number' => $settings['vat_number'] ?? null,
            'agreement_type' => $settings['agreement_type'] ?? 'chair_renter',
            'commission_rate' => (float) ($settings['commission_rate'] ?? 0),
            'rent_cents' => (int) ($settings['rent_cents'] ?? 0),
            'payout_method' => $settings['payout_method'] ?? null,
            'payout_reference' => $settings['payout_reference'] ?? null,
            'contract_start_at' => $settings['contract_start_at'] ?? null,
            'contract_end_at' => $settings['contract_end_at'] ?? null,
            'notes' => $settings['notes'] ?? null,
            'is_active' => (bool) ($settings['is_active'] ?? true),
        ];
    }

    public function updateWorkspaceProfile(StaffMember $staffMember, array $data): StaffMember
    {
        $settings = is_array($staffMember->self_employed_settings) ? $staffMember->self_employed_settings : [];
        $merged = array_merge($settings, array_filter([
            'legal_name' => $data['legal_name'] ?? null,
            'trading_name' => $data['trading_name'] ?? null,
            'tax_id' => $data['tax_id'] ?? null,
            'vat_number' => $data['vat_number'] ?? null,
            'agreement_type' => $data['agreement_type'] ?? null,
            'commission_rate' => array_key_exists('commission_rate', $data) ? (float) $data['commission_rate'] : null,
            'rent_cents' => array_key_exists('rent_cents', $data) ? (int) $data['rent_cents'] : null,
            'payout_method' => $data['payout_method'] ?? null,
            'payout_reference' => $data['payout_reference'] ?? null,
            'contract_start_at' => $data['contract_start_at'] ?? null,
            'contract_end_at' => $data['contract_end_at'] ?? null,
            'notes' => $data['notes'] ?? null,
            'is_active' => array_key_exists('is_active', $data) ? (bool) $data['is_active'] : null,
        ], fn ($value) => $value !== null));

        return $this->sync($staffMember, [
            'employment_mode' => StaffEmploymentMode::SelfEmployed->value,
            'self_employed_settings' => $merged,
        ]);
    }
}
