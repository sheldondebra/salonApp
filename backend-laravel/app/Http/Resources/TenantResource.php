<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TenantResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'uuid' => $this->uuid,
            'name' => $this->name,
            'slug' => $this->slug,
            'status' => $this->status?->value ?? $this->status,
            'plan' => $this->plan,
            'timezone' => $this->timezone,
            'currency' => $this->currency,
            'branding' => $this->branding(),
            'domains' => $this->whenLoaded('domains', fn () => $this->domains->map(fn ($d) => [
                'domain' => $d->domain,
                'type' => $d->type?->value ?? $d->type,
                'is_primary' => $d->is_primary,
                'is_verified' => $d->isVerified(),
            ])),
        ];
    }
}
