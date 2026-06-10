<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\PaymentRequest */
class PaymentRequestResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'reference' => $this->reference,
            'amount_cents' => $this->amount_cents,
            'currency' => $this->currency,
            'phone' => $this->phone,
            'email' => $this->email,
            'gateway' => $this->gateway,
            'payment_channel' => $this->payment_channel,
            'reason' => $this->reason instanceof \BackedEnum ? $this->reason->value : $this->reason,
            'description' => $this->description,
            'status' => $this->status instanceof \BackedEnum ? $this->status->value : $this->status,
            'provider_status' => $this->provider_status,
            'external_reference' => $this->external_reference,
            'transaction_uuid' => $this->transaction_uuid,
            'failed_reason' => $this->failed_reason,
            'expires_at' => $this->expires_at?->toIso8601String(),
            'paid_at' => $this->paid_at?->toIso8601String(),
            'callback_received_at' => $this->callback_received_at?->toIso8601String(),
            'status_checked_at' => $this->status_checked_at?->toIso8601String(),
            'cancelled_at' => $this->cancelled_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
            'customer' => $this->whenLoaded('customer', fn () => [
                'id' => $this->customer?->id,
                'name' => $this->customer?->name,
                'email' => $this->customer?->email,
                'phone' => $this->customer?->phone,
            ]),
            'requested_by' => $this->whenLoaded('requestedBy', fn () => [
                'id' => $this->requestedBy?->id,
                'name' => $this->requestedBy?->name,
                'email' => $this->requestedBy?->email,
            ]),
            'branch' => $this->whenLoaded('branch', fn () => $this->branch ? [
                'id' => $this->branch->id,
                'name' => $this->branch->name,
            ] : null),
            'booking' => $this->whenLoaded('booking', fn () => $this->booking ? [
                'id' => $this->booking->id,
                'uuid' => $this->booking->uuid,
                'starts_at' => $this->booking->starts_at?->toIso8601String(),
                'service_name' => $this->booking->relationLoaded('service') ? $this->booking->service?->name : null,
            ] : null),
            'pos_sale' => $this->whenLoaded('posSale', fn () => $this->posSale ? [
                'id' => $this->posSale->id,
                'uuid' => $this->posSale->uuid,
                'sale_number' => $this->posSale->sale_number,
                'total_cents' => $this->posSale->total_cents,
            ] : null),
            'sms_purchase_invoice' => $this->whenLoaded('smsPurchaseInvoice', fn () => $this->smsPurchaseInvoice ? [
                'id' => $this->smsPurchaseInvoice->id,
                'amount_cents' => $this->smsPurchaseInvoice->amount_cents,
                'currency' => $this->smsPurchaseInvoice->currency,
                'status' => $this->smsPurchaseInvoice->status,
            ] : null),
            'invoice_id' => $this->invoice_id,
        ];
    }
}
