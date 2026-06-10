<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\TenantWallet */
class TenantWalletResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'tenant_id' => $this->tenant_id,
            'currency' => $this->currency,
            'available_balance' => (int) $this->available_balance,
            'pending_balance' => (int) $this->pending_balance,
            'total_collected' => (int) $this->total_collected,
            'total_fees' => (int) $this->total_fees,
            'total_settled' => (int) $this->total_settled,
            'total_refunded' => (int) $this->total_refunded,
            'status' => $this->status instanceof \BackedEnum ? $this->status->value : $this->status,
            'updated_at' => $this->updated_at?->toIso8601String(),
            'tenant' => $this->whenLoaded('tenant', fn () => [
                'id' => $this->tenant->id,
                'name' => $this->tenant->name,
                'slug' => $this->tenant->slug,
            ]),
        ];
    }
}
