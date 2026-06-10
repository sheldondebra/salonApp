<?php

namespace App\Integrations\MtnMomo;

use App\Enums\ProviderAccountType;
use App\Enums\TenantPaymentMode;
use App\Models\PaymentProviderAccount;
use App\Models\Tenant;
use App\Services\PaymentProviderAccountService;
use App\Services\TenantPaymentSettingService;

class MtnMomoConfigResolver
{
    public function __construct(
        protected PaymentProviderAccountService $accounts,
        protected TenantPaymentSettingService $paymentSettings,
    ) {}

    /** @return array{api_user: ?string, api_key: ?string, subscription_key: ?string, target_environment: string, base_url: string, mock: bool, account: PaymentProviderAccount} */
    public function forTenant(Tenant $tenant): array
    {
        $mode = $this->paymentSettings->forTenant($tenant)->mode;
        $account = $mode === TenantPaymentMode::TenantOwnAccount
            ? $this->accounts->tenantAccount($tenant)
            : $this->accounts->platformAccount();

        $env = config('integrations.payments.providers.mtn_momo', []);
        $resolved = $account->account_type === ProviderAccountType::Platform
            ? $this->accounts->resolvePlatformCredentials($account)
            : [
                'api_user' => $account->api_user,
                'api_key' => $account->api_key,
                'subscription_key' => $account->subscription_key,
                'target_environment' => $account->target_environment,
            ];

        return [
            'api_user' => $resolved['api_user'] ?? null,
            'api_key' => $resolved['api_key'] ?? null,
            'subscription_key' => $resolved['subscription_key'] ?? null,
            'target_environment' => (string) ($resolved['target_environment'] ?? $env['target_environment'] ?? 'sandbox'),
            'base_url' => rtrim((string) ($env['base_url'] ?? 'https://sandbox.momodeveloper.mtn.com'), '/'),
            'mock' => (bool) ($env['mock'] ?? false),
            'account' => $account,
        ];
    }

    public function isConfigured(array $config): bool
    {
        if ($config['mock'] ?? false) {
            return true;
        }

        return filled($config['api_user'] ?? null)
            && filled($config['api_key'] ?? null)
            && filled($config['subscription_key'] ?? null);
    }
}
