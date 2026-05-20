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
        ];
    }
}
