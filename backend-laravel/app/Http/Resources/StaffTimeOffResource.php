<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\StaffTimeOffRequest */
class StaffTimeOffResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'staff_member_id' => $this->staff_member_id,
            'location_id' => $this->location_id,
            'purpose' => $this->purpose,
            'custom_purpose' => $this->custom_purpose,
            'start_at' => $this->start_at?->toIso8601String(),
            'end_at' => $this->end_at?->toIso8601String(),
            'all_day' => (bool) $this->all_day,
            'note' => $this->note,
            'status' => $this->status,
            'reviewed_at' => $this->reviewed_at?->toIso8601String(),
        ];
    }
}
