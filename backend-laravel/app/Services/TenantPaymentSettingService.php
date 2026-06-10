<?php

namespace App\Services;

use App\Enums\PaymentGateway;
use App\Enums\SettlementMethod;
use App\Enums\SettlementSchedule;
use App\Enums\TenantPaymentMode;
use App\Models\Tenant;
use App\Models\TenantPaymentSetting;
use App\Models\User;
use Illuminate\Validation\ValidationException;

class TenantPaymentSettingService
{
    /** @return array<string, mixed> */
    public function defaults(): array
    {
        return [
            'mode' => TenantPaymentMode::PlatformAccount->value,
            'default_gateway' => PaymentGateway::Paystack->value,
            'mtn_momo_enabled' => true,
            'paystack_enabled' => true,
            'flutterwave_enabled' => true,
            'settlement_schedule' => SettlementSchedule::Manual->value,
            'settlement_method' => null,
            'settlement_account_name' => null,
            'settlement_account_number' => null,
            'settlement_provider' => null,
            'settlement_notes' => null,
            'is_payment_enabled' => true,
        ];
    }

    public function forTenant(Tenant $tenant): TenantPaymentSetting
    {
        return TenantPaymentSetting::query()->firstOrCreate(
            ['tenant_id' => $tenant->id],
            $this->defaults()
        );
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Tenant $tenant, array $data, User $actor): TenantPaymentSetting
    {
        $setting = $this->forTenant($tenant);

        if (array_key_exists('mode', $data)) {
            $mode = TenantPaymentMode::from($data['mode']);
            $setting->mode = $mode;

            if ($mode === TenantPaymentMode::Disabled) {
                $setting->is_payment_enabled = false;
            } elseif (! array_key_exists('is_payment_enabled', $data)) {
                $setting->is_payment_enabled = true;
            }

            if ($mode === TenantPaymentMode::TenantOwnAccount) {
                $setting->approved_by_user_id = null;
                $setting->approved_at = null;
            }
        }

        if (array_key_exists('is_payment_enabled', $data)) {
            if ($setting->mode === TenantPaymentMode::Disabled && $data['is_payment_enabled']) {
                throw ValidationException::withMessages([
                    'is_payment_enabled' => 'Enable a payment mode before turning on collection.',
                ]);
            }
            $setting->is_payment_enabled = (bool) $data['is_payment_enabled'];
        }

        foreach (['mtn_momo_enabled', 'paystack_enabled', 'flutterwave_enabled'] as $flag) {
            if (array_key_exists($flag, $data)) {
                $setting->{$flag} = (bool) $data[$flag];
            }
        }

        if (array_key_exists('default_gateway', $data)) {
            $gateway = PaymentGateway::from($data['default_gateway']);
            $this->assertGatewayEnabled($setting, $gateway);
            $setting->default_gateway = $gateway;
        }

        if (array_key_exists('settlement_schedule', $data)) {
            $setting->settlement_schedule = SettlementSchedule::from($data['settlement_schedule']);
        }

        foreach ([
            'settlement_method',
            'settlement_account_name',
            'settlement_account_number',
            'settlement_provider',
            'settlement_notes',
        ] as $field) {
            if (array_key_exists($field, $data)) {
                $value = $data[$field];
                if ($field === 'settlement_method' && $value !== null && $value !== '') {
                    $setting->settlement_method = SettlementMethod::from($value);
                } else {
                    $setting->{$field} = $value === '' ? null : $value;
                }
            }
        }

        $setting->save();

        return $setting->fresh(['approvedBy:id,name,email']);
    }

    protected function assertGatewayEnabled(TenantPaymentSetting $setting, PaymentGateway $gateway): void
    {
        $enabled = match ($gateway) {
            PaymentGateway::Paystack => $setting->paystack_enabled,
            PaymentGateway::Flutterwave => $setting->flutterwave_enabled,
            PaymentGateway::MtnMomo => $setting->mtn_momo_enabled,
        };

        if (! $enabled) {
            throw ValidationException::withMessages([
                'default_gateway' => 'The selected gateway is not enabled for this tenant.',
            ]);
        }
    }

    /** @return array<string, array{enabled: bool, status: string, label: string}> */
    public function gatewayStatus(TenantPaymentSetting $setting): array
    {
        $viaPlatform = $setting->mode === TenantPaymentMode::PlatformAccount;
        $ownAccount = $setting->mode === TenantPaymentMode::TenantOwnAccount;
        $paymentsOff = $setting->mode === TenantPaymentMode::Disabled || ! $setting->is_payment_enabled;

        $statusFor = function (bool $enabled) use ($viaPlatform, $ownAccount, $paymentsOff): string {
            if ($paymentsOff) {
                return 'disabled';
            }
            if ($viaPlatform) {
                return $enabled ? 'platform' : 'unavailable';
            }
            if ($ownAccount) {
                return $enabled ? 'pending_setup' : 'disabled';
            }

            return $enabled ? 'enabled' : 'disabled';
        };

        return [
            'paystack' => [
                'enabled' => $setting->paystack_enabled,
                'status' => $statusFor($setting->paystack_enabled),
                'label' => 'Paystack',
            ],
            'flutterwave' => [
                'enabled' => $setting->flutterwave_enabled,
                'status' => $statusFor($setting->flutterwave_enabled),
                'label' => 'Flutterwave',
            ],
            'mtn_momo' => [
                'enabled' => $setting->mtn_momo_enabled,
                'status' => $statusFor($setting->mtn_momo_enabled),
                'label' => 'MTN MoMo',
            ],
        ];
    }
}
