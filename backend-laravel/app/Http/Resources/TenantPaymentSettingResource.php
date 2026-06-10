<?php

namespace App\Http\Resources;

use App\Services\TenantPaymentSettingService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\TenantPaymentSetting */
class TenantPaymentSettingResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $service = app(TenantPaymentSettingService::class);

        return [
            'id' => $this->id,
            'mode' => $this->mode instanceof \BackedEnum ? $this->mode->value : $this->mode,
            'default_gateway' => $this->default_gateway instanceof \BackedEnum
                ? $this->default_gateway->value
                : $this->default_gateway,
            'mtn_momo_enabled' => $this->mtn_momo_enabled,
            'paystack_enabled' => $this->paystack_enabled,
            'flutterwave_enabled' => $this->flutterwave_enabled,
            'settlement_schedule' => $this->settlement_schedule instanceof \BackedEnum
                ? $this->settlement_schedule->value
                : $this->settlement_schedule,
            'settlement_method' => $this->settlement_method instanceof \BackedEnum
                ? $this->settlement_method->value
                : $this->settlement_method,
            'settlement_account_name' => $this->settlement_account_name,
            'settlement_account_number' => $this->settlement_account_number,
            'settlement_provider' => $this->settlement_provider,
            'settlement_notes' => $this->settlement_notes,
            'is_payment_enabled' => $this->is_payment_enabled,
            'approved_at' => $this->approved_at?->toIso8601String(),
            'approved_by' => $this->whenLoaded('approvedBy', fn () => $this->approvedBy ? [
                'id' => $this->approvedBy->id,
                'name' => $this->approvedBy->name,
                'email' => $this->approvedBy->email,
            ] : null),
            'gateway_status' => $service->gatewayStatus($this->resource),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
