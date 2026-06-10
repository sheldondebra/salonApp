<?php

namespace App\Http\Requests\TenantPaymentSettings;

use App\Enums\PaymentGateway;
use App\Enums\SettlementMethod;
use App\Enums\SettlementSchedule;
use App\Enums\TenantPaymentMode;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateTenantPaymentSettingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'mode' => ['sometimes', Rule::in(TenantPaymentMode::values())],
            'default_gateway' => ['sometimes', Rule::in(PaymentGateway::values())],
            'mtn_momo_enabled' => ['sometimes', 'boolean'],
            'paystack_enabled' => ['sometimes', 'boolean'],
            'flutterwave_enabled' => ['sometimes', 'boolean'],
            'settlement_schedule' => ['sometimes', Rule::in(SettlementSchedule::values())],
            'settlement_method' => ['nullable', Rule::in(SettlementMethod::values())],
            'settlement_account_name' => ['nullable', 'string', 'max:255'],
            'settlement_account_number' => ['nullable', 'string', 'max:64'],
            'settlement_provider' => ['nullable', 'string', 'max:255'],
            'settlement_notes' => ['nullable', 'string', 'max:2000'],
            'is_payment_enabled' => ['sometimes', 'boolean'],
        ];
    }
}
