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
            'booked_via' => $this->booked_via ?? 'staff',
            'payment_status' => $this->payment_status ?? 'unpaid',
            'amount_due_cents' => (int) ($this->amount_due_cents ?? 0),
            'deposit_paid_cents' => (int) ($this->deposit_paid_cents ?? 0),
            'notes' => $this->notes,
            'booking_group_id' => $this->booking_group_id,
            'location' => $this->whenLoaded('location', fn () => new LocationResource($this->location)),
            'service' => new ServiceResource($this->whenLoaded('service')),
            'staff_member' => $this->whenLoaded('staffMember', fn () => [
                'id' => $this->staffMember->id,
                'display_name' => $this->staffMember->display_name,
                'title' => $this->staffMember->title,
            ]),
            'client' => $this->whenLoaded('client', fn () => new UserResource($this->client)),
            'tenant' => $this->whenLoaded('tenant', fn () => [
                'id' => $this->tenant->id,
                'name' => $this->tenant->name,
                'slug' => $this->tenant->slug,
            ]),
        ];
    }
}
