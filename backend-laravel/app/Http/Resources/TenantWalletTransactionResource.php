<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\TenantWalletTransaction */
class TenantWalletTransactionResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'type' => $this->type instanceof \BackedEnum ? $this->type->value : $this->type,
            'direction' => $this->direction instanceof \BackedEnum ? $this->direction->value : $this->direction,
            'amount' => (int) $this->amount,
            'balance_before' => (int) $this->balance_before,
            'balance_after' => (int) $this->balance_after,
            'reference' => $this->reference,
            'description' => $this->description,
            'payment_request_id' => $this->payment_request_id,
            'settlement_id' => $this->settlement_id,
            'metadata' => $this->metadata,
            'created_at' => $this->created_at?->toIso8601String(),
            'created_by' => $this->whenLoaded('createdBy', fn () => $this->createdBy ? [
                'id' => $this->createdBy->id,
                'name' => $this->createdBy->name,
            ] : null),
        ];
    }
}
