<?php

namespace App\Services;

use App\Enums\ProviderAccountStatus;

class PlatformPaymentGatewaysService
{
    public function __construct(
        protected PaymentProviderAccountService $mtnAccounts,
    ) {}

    /** @return array<string, mixed> */
    public function overview(): array
    {
        $mtnAccount = $this->mtnAccounts->payload($this->mtnAccounts->platformAccount());
        $paystack = config('integrations.payments.providers.paystack', []);
        $flutterwave = config('integrations.payments.providers.flutterwave', []);

        $paystackConfigured = filled($paystack['secret_key'] ?? null);
        $flutterwaveConfigured = filled($flutterwave['secret_key'] ?? null);

        return [
            'summary' => [
                'total' => 3,
                'configured' => ($mtnAccount['configured'] ? 1 : 0)
                    + ($paystackConfigured ? 1 : 0)
                    + ($flutterwaveConfigured ? 1 : 0),
                'connected' => ($mtnAccount['status'] === ProviderAccountStatus::Connected->value ? 1 : 0)
                    + ($paystackConfigured ? 1 : 0)
                    + ($flutterwaveConfigured ? 1 : 0),
            ],
            'gateways' => [
                $this->mtnGatewayPayload($mtnAccount),
                $this->envGatewayPayload('paystack', 'Paystack', $paystack),
                $this->envGatewayPayload('flutterwave', 'Flutterwave', $flutterwave),
            ],
        ];
    }

    /** @param  array<string, mixed>  $account */
    private function mtnGatewayPayload(array $account): array
    {
        return [
            'id' => 'mtn_momo',
            'name' => 'MTN Mobile Money',
            'description' => 'Platform collection account for Request to Pay and tenant wallet top-ups.',
            'configured' => (bool) ($account['configured'] ?? false),
            'connected' => ($account['status'] ?? '') === ProviderAccountStatus::Connected->value,
            'status' => $account['status'] ?? ProviderAccountStatus::NotConfigured->value,
            'key_source' => $account['key_source'] ?? null,
            'environment' => $account['environment'] ?? null,
            'country' => $account['country'] ?? null,
            'currency' => $account['currency'] ?? null,
            'target_environment' => $account['target_environment'] ?? null,
            'callback_host' => $account['callback_host'] ?? null,
            'public_key_masked' => $account['api_user_masked'] ?? null,
            'secret_key_masked' => $account['api_key_masked'] ?? null,
            'subscription_key_masked' => $account['subscription_key_masked'] ?? null,
            'last_health_check_at' => $account['last_health_check_at'] ?? null,
            'last_successful_token_at' => $account['last_successful_token_at'] ?? null,
            'last_error' => $account['last_error'] ?? null,
            'updated_at' => $account['updated_at'] ?? null,
            'supports_health_check' => true,
            'account' => $account,
        ];
    }

    /** @param  array<string, mixed>  $config */
    private function envGatewayPayload(string $id, string $name, array $config): array
    {
        $configured = filled($config['secret_key'] ?? null);

        return [
            'id' => $id,
            'name' => $name,
            'description' => 'Platform billing and card payments via '.strtolower($name).'.',
            'configured' => $configured,
            'connected' => $configured,
            'status' => $configured ? 'configured' : ProviderAccountStatus::NotConfigured->value,
            'key_source' => $configured ? 'environment' : null,
            'environment' => null,
            'country' => null,
            'currency' => null,
            'target_environment' => null,
            'callback_host' => null,
            'public_key_masked' => $this->mtnAccounts->maskSecret($config['public_key'] ?? null),
            'secret_key_masked' => $configured ? '••••••••••••' : null,
            'subscription_key_masked' => null,
            'last_health_check_at' => null,
            'last_successful_token_at' => null,
            'last_error' => null,
            'updated_at' => null,
            'supports_health_check' => false,
            'account' => null,
        ];
    }
}
