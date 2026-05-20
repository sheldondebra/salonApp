<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'uuid' => $this->uuid,
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'avatar_url' => $this->avatar_url,
            'bio' => $this->bio,
            'date_of_birth' => $this->date_of_birth?->toDateString(),
            'marketing_opt_in' => $this->marketing_opt_in,
            'user_type' => $this->user_type?->value ?? $this->user_type,
            'account_intent' => $this->account_intent,
            'onboarding_status' => $this->onboarding_status?->value ?? $this->onboarding_status,
            'selected_plan' => $this->selected_plan,
            'owned_tenant_slug' => $this->when(
                $this->relationLoaded('tenants'),
                fn () => $this->tenants->first(fn ($t) => (bool) ($t->pivot->is_owner ?? false))?->slug
            ),
            'roles' => $this->whenLoaded('roles', fn () => $this->roles->pluck('name')),
        ];
    }
}
