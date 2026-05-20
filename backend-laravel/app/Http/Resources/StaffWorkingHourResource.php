<?php

namespace App\Http\Resources;

use App\Services\StaffWorkingHoursService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StaffWorkingHourResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->when($this->id, $this->id),
            'staff_member_id' => $this->staff_member_id,
            'location_id' => $this->location_id,
            'day_of_week' => $this->day_of_week,
            'day_label' => StaffWorkingHoursService::DAY_LABELS[$this->day_of_week] ?? 'Day',
            'is_working_day' => $this->is_working_day,
            'start_time' => $this->startTimeHi(),
            'end_time' => $this->endTimeHi(),
            'effective_from' => $this->effective_from?->toDateString(),
            'effective_to' => $this->effective_to?->toDateString(),
        ];
    }
}
