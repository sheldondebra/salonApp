<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\StaffBreak */
class StaffBreakResource extends JsonResource
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
            'title' => $this->title,
            'break_type' => $this->break_type,
            'day_of_week' => $this->day_of_week,
            'start_time' => is_string($this->start_time) ? substr($this->start_time, 0, 5) : $this->start_time?->format('H:i'),
            'end_time' => is_string($this->end_time) ? substr($this->end_time, 0, 5) : $this->end_time?->format('H:i'),
            'repeats_weekly' => (bool) $this->repeats_weekly,
            'date' => $this->date?->format('Y-m-d'),
            'note' => $this->note,
        ];
    }
}
