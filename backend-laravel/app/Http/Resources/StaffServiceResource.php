<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StaffServiceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $service = $this->relationLoaded('service') ? $this->service : null;

        return [
            'id' => $this->id,
            'staff_member_id' => $this->staff_member_id,
            'service_id' => $this->service_id,
            'custom_duration_minutes' => $this->custom_duration_minutes,
            'custom_price_cents' => $this->custom_price_cents,
            'effective_duration_minutes' => $this->effectiveDurationMinutes(),
            'effective_price_cents' => $this->effectivePriceCents(),
            'is_active' => $this->is_active,
            'service' => $service ? [
                'id' => $service->id,
                'uuid' => $service->uuid,
                'name' => $service->name,
                'duration_minutes' => $service->duration_minutes,
                'price_cents' => $service->price_cents,
                'category' => $service->relationLoaded('category') && $service->category ? [
                    'id' => $service->category->id,
                    'name' => $service->category->name,
                ] : null,
            ] : null,
        ];
    }
}
