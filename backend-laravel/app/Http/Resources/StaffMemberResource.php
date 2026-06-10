<?php

namespace App\Http\Resources;

use App\Models\StaffMember;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin StaffMember */
class StaffMemberResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $initials = $this->initials ?: StaffMember::makeInitials($this->display_name);

        return [
            'id' => $this->id,
            'uuid' => $this->uuid,
            'tenant_id' => $this->tenant_id,
            'location_id' => $this->location_id,
            'user_id' => $this->user_id,
            'display_name' => $this->display_name,
            'job_title' => $this->title,
            'title' => $this->title,
            'initials' => $initials,
            'bio' => $this->bio,
            'avatar_url' => $this->avatar_url,
            'is_bookable' => $this->is_bookable,
            'is_active' => $this->is_active,
            'employment_status' => $this->employment_status ?? StaffMember::STATUS_ACTIVE,
            'employment_type' => $this->employment_type,
            'employment_mode' => $this->employment_mode?->value ?? $this->employment_mode,
            'self_employed_settings' => $this->self_employed_settings,
            'hire_date' => $this->hire_date?->toDateString(),
            'color_code' => $this->color_code,
            'appointments_count' => $this->whenCounted('appointments'),
            'services_count' => $this->whenCounted('activeStaffServices'),
            'location' => $this->whenLoaded('location', fn () => [
                'id' => $this->location->id,
                'name' => $this->location->name,
            ]),
            'user' => $this->whenLoaded('user', fn () => [
                'id' => $this->user->id,
                'name' => $this->user->name,
                'email' => $this->user->email,
                'phone' => $this->user->phone,
                'avatar_url' => $this->user->avatar_url,
            ]),
            'payroll_summary' => $this->whenLoaded('payrollProfile', function () {
                $profile = $this->payrollProfile;
                if (! $profile) {
                    return null;
                }

                return [
                    'pay_type' => $profile->pay_type,
                    'base_salary_cents' => $profile->base_salary_cents,
                    'hourly_rate_cents' => $profile->hourly_rate_cents,
                    'commission_rate' => (float) $profile->commission_rate,
                    'pay_role_name' => $profile->payRole?->name,
                    'pay_role_color' => $profile->payRole?->color,
                ];
            }),
            'chair_rental_profile' => $this->whenLoaded('chairRentalProfile', function () {
                $profile = $this->chairRentalProfile;

                return $profile ? [
                    'id' => $profile->id,
                    'rental_fee_cents' => (int) $profile->rental_fee_cents,
                    'billing_interval' => $profile->billing_interval?->value ?? $profile->billing_interval,
                    'schedule' => $profile->schedule ?? [],
                    'is_active' => (bool) $profile->is_active,
                ] : null;
            }),
        ];
    }
}
