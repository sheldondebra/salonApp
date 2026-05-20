<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\TenantSmsWallet */
class SmsWalletResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'tenant_id' => $this->tenant_id,
            'balance_credits' => (int) $this->balance_credits,
            'total_purchased' => (int) $this->total_purchased,
            'total_allocated' => (int) $this->total_allocated,
            'total_used' => (int) $this->total_used,
            'low_balance_threshold' => (int) $this->low_balance_threshold,
            'is_low_balance' => $this->isLowBalance(),
            'tenant' => $this->whenLoaded('tenant', fn () => [
                'id' => $this->tenant->id,
                'name' => $this->tenant->name,
                'slug' => $this->tenant->slug,
            ]),
        ];
    }
}
