<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AppointmentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'uuid' => $this->uuid,
            'starts_at' => $this->starts_at?->toIso8601String(),
            'ends_at' => $this->ends_at?->toIso8601String(),
            'status' => $this->status,
            'notes' => $this->notes,
            'service' => new ServiceResource($this->whenLoaded('service')),
            'staff_member' => $this->whenLoaded('staffMember', fn () => [
                'id' => $this->staffMember->id,
                'display_name' => $this->staffMember->display_name,
                'title' => $this->staffMember->title,
            ]),
            'client' => $this->whenLoaded('client', fn () => new UserResource($this->client)),
        ];
    }
}
