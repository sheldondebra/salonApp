<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\SmsPackage */
class SmsPackageResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'sms_credits' => (int) $this->sms_credits,
            'bonus_credits' => (int) $this->bonus_credits,
            'total_credits' => $this->totalCredits(),
            'price_cents' => (int) $this->price_cents,
            'currency' => $this->currency,
            'validity_days' => $this->validity_days,
            'description' => $this->description,
            'sort_order' => (int) $this->sort_order,
            'is_active' => (bool) $this->is_active,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
