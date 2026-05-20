<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\SmsWalletTransaction */
class SmsWalletTransactionResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'type' => $this->type?->value ?? $this->type,
            'amount' => (int) $this->amount,
            'balance_after' => (int) $this->balance_after,
            'notes' => $this->notes,
            'reference_type' => $this->reference_type,
            'reference_id' => $this->reference_id,
            'sms_message_id' => $this->sms_message_id,
            'created_at' => $this->created_at?->toIso8601String(),
            'performed_by' => $this->whenLoaded('performedBy', fn () => [
                'id' => $this->performedBy?->id,
                'name' => $this->performedBy?->name,
            ]),
        ];
    }
}
