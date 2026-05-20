<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Sale */
class SaleResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'uuid' => $this->uuid,
            'sale_number' => $this->sale_number,
            'status' => $this->status?->value ?? $this->status,
            'location_id' => $this->location_id,
            'client_user_id' => $this->client_user_id,
            'appointment_id' => $this->appointment_id,
            'subtotal_cents' => $this->subtotal_cents,
            'discount_cents' => $this->discount_cents,
            'tax_cents' => $this->tax_cents,
            'service_charge_cents' => $this->service_charge_cents,
            'tip_cents' => $this->tip_cents,
            'total_cents' => $this->total_cents,
            'currency' => $this->currency,
            'payment_method' => $this->payment_method,
            'coupon_code' => $this->coupon_code,
            'notes' => $this->notes,
            'metadata' => $this->metadata,
            'completed_at' => $this->completed_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
            'client' => $this->whenLoaded('client', fn () => [
                'id' => $this->client?->id,
                'name' => $this->client?->name,
                'email' => $this->client?->email,
                'phone' => $this->client?->phone,
            ]),
            'location' => $this->whenLoaded('location', fn () => [
                'id' => $this->location?->id,
                'name' => $this->location?->name,
            ]),
            'appointment' => $this->whenLoaded('appointment', fn () => [
                'id' => $this->appointment?->id,
                'uuid' => $this->appointment?->uuid,
            ]),
            'items' => SaleItemResource::collection($this->whenLoaded('items')),
        ];
    }
}
