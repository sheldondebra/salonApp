<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LocationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'uuid' => $this->uuid,
            'name' => $this->name,
            'address_line1' => $this->address_line1,
            'city' => $this->city,
            'country' => $this->country,
            'is_active' => $this->is_active,
            'label' => collect([$this->name, $this->city])->filter()->join(' · '),
        ];
    }
}
