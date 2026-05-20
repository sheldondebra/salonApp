<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BookingGroupResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'uuid' => $this->uuid,
            'party_size' => $this->party_size,
            'booking_type' => $this->booking_type,
            'recurrence' => $this->recurrence,
            'notes' => $this->notes,
            'location' => new LocationResource($this->whenLoaded('location')),
            'appointments' => AppointmentResource::collection($this->whenLoaded('appointments')),
        ];
    }
}
