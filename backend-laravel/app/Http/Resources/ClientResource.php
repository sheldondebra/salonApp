<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** Tenant-scoped client (User) summary for directory CRUD. */
class ClientResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'uuid' => $this->uuid,
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'is_active' => $this->is_active,
            'joined_at' => $this->when(isset($this->pivot), fn () => $this->pivot?->joined_at),
            'appointments_count' => $this->when(isset($this->appointments_count), $this->appointments_count),
        ];
    }
}
