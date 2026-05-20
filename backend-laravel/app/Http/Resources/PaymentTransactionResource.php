<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PaymentTransactionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'uuid' => $this->uuid,
            'provider' => $this->provider,
            'purpose' => $this->purpose?->value ?? $this->purpose,
            'provider_reference' => $this->provider_reference,
            'amount_cents' => $this->amount_cents,
            'currency' => $this->currency,
            'status' => $this->status,
            'failure_reason' => $this->failure_reason,
            'paid_at' => $this->paid_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
            'appointment' => $this->whenLoaded('appointment', fn () => new AppointmentResource($this->appointment)),
            'client' => $this->whenLoaded('user', fn () => [
                'name' => $this->user->name,
                'email' => $this->user->email,
            ]),
        ];
    }
}
