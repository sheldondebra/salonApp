<?php

namespace App\Services;

use App\Enums\PaymentProviderName;
use App\Enums\ProviderAccountStatus;
use App\Enums\ProviderAccountType;
use App\Enums\ProviderEnvironment;
use App\Enums\TenantPaymentMode;
use App\Models\PaymentProviderAccount;
use App\Models\Tenant;
use App\Integrations\MtnMomo\MtnMomoTokenService;
use Illuminate\Support\Facades\Cache;
use Illuminate\Validation\ValidationException;

class PaymentProviderAccountService
{
    private const PROVIDER = PaymentProviderName::MtnMomo;

    private const PLATFORM_CACHE = 'mtn_momo_platform_account';

    /** @return array<string, mixed> */
    public function platformDefaults(): array
    {
        $env = config('integrations.payments.providers.mtn_momo', []);

        return [
            'tenant_id' => null,
            'provider' => self::PROVIDER->value,
            'account_type' => ProviderAccountType::Platform->value,
            'environment' => $env['environment'] ?? ProviderEnvironment::Sandbox->value,
            'country' => $env['country'] ?? 'GH',
            'currency' => $env['currency'] ?? 'GHS',
            'target_environment' => $env['target_environment'] ?? 'sandbox',
            'callback_host' => $env['callback_host'] ?? null,
            'status' => ProviderAccountStatus::NotConfigured->value,
        ];
    }

    /** @return array<string, mixed> */
    public function tenantDefaults(Tenant $tenant): array
    {
        return [
            'tenant_id' => $tenant->id,
            'provider' => self::PROVIDER->value,
            'account_type' => ProviderAccountType::Tenant->value,
            'environment' => ProviderEnvironment::Sandbox->value,
            'country' => $tenant->country_code ?: 'GH',
            'currency' => $tenant->currency ?: 'GHS',
            'target_environment' => 'sandbox',
            'status' => ProviderAccountStatus::NotConfigured->value,
        ];
    }

    public function platformAccount(): PaymentProviderAccount
    {
        return Cache::remember(self::PLATFORM_CACHE, 300, function () {
            return PaymentProviderAccount::query()
                ->platform()
                ->forProvider(self::PROVIDER)
                ->firstOrCreate(
                    [
                        'tenant_id' => null,
                        'provider' => self::PROVIDER->value,
                        'account_type' => ProviderAccountType::Platform->value,
                    ],
                    $this->platformDefaults()
                );
        });
    }

    public function tenantAccount(Tenant $tenant): PaymentProviderAccount
    {
        return PaymentProviderAccount::query()
            ->forTenant($tenant->id)
            ->forProvider(self::PROVIDER)
            ->where('account_type', ProviderAccountType::Tenant->value)
            ->firstOrCreate(
                [
                    'tenant_id' => $tenant->id,
                    'provider' => self::PROVIDER->value,
                    'account_type' => ProviderAccountType::Tenant->value,
                ],
                $this->tenantDefaults($tenant)
            );
    }

    public function clearPlatformCache(): void
    {
        Cache::forget(self::PLATFORM_CACHE);
    }

    public function maskSecret(?string $value): ?string
    {
        if (! filled($value)) {
            return null;
        }

        $len = strlen($value);
        if ($len <= 4) {
            return str_repeat('•', 8);
        }

        return str_repeat('•', min(16, max(8, $len - 4))).substr($value, -4);
    }

    /** @return array<string, mixed> */
    public function resolvePlatformCredentials(PaymentProviderAccount $account): array
    {
        $env = config('integrations.payments.providers.mtn_momo', []);

        return [
            'api_user' => filled($account->api_user) ? $account->api_user : ($env['api_user'] ?? null),
            'api_key' => filled($account->api_key) ? $account->api_key : ($env['api_key'] ?? null),
            'subscription_key' => filled($account->subscription_key) ? $account->subscription_key : ($env['subscription_key'] ?? null),
            'target_environment' => $account->target_environment ?: ($env['target_environment'] ?? null),
            'callback_host' => $account->callback_host ?: ($env['callback_host'] ?? null),
        ];
    }

    public function isPlatformConfigured(PaymentProviderAccount $account): bool
    {
        $creds = $this->resolvePlatformCredentials($account);

        return filled($creds['api_user']) && filled($creds['api_key']) && filled($creds['subscription_key']);
    }

    /** @return array<string, mixed> */
    public function payload(PaymentProviderAccount $account, bool $includeSecretsMeta = true): array
    {
        $isPlatform = $account->account_type === ProviderAccountType::Platform;
        $resolved = $isPlatform ? $this->resolvePlatformCredentials($account) : [
            'api_user' => $account->api_user,
            'api_key' => $account->api_key,
            'subscription_key' => $account->subscription_key,
            'target_environment' => $account->target_environment,
            'callback_host' => $account->callback_host,
        ];

        $configured = filled($resolved['api_user'])
            && filled($resolved['api_key'])
            && filled($resolved['subscription_key']);

        $payload = [
            'id' => $account->id,
            'provider' => $account->provider instanceof \BackedEnum ? $account->provider->value : $account->provider,
            'account_type' => $account->account_type instanceof \BackedEnum ? $account->account_type->value : $account->account_type,
            'environment' => $account->environment instanceof \BackedEnum ? $account->environment->value : $account->environment,
            'country' => $account->country,
            'currency' => $account->currency,
            'target_environment' => $resolved['target_environment'],
            'callback_host' => $resolved['callback_host'],
            'status' => $account->status instanceof \BackedEnum ? $account->status->value : $account->status,
            'configured' => $configured,
            'last_health_check_at' => $account->last_health_check_at?->toIso8601String(),
            'last_successful_token_at' => $account->last_successful_token_at?->toIso8601String(),
            'last_balance_sync_at' => $account->last_balance_sync_at?->toIso8601String(),
            'last_error' => $account->last_error,
            'updated_at' => $account->updated_at?->toIso8601String(),
        ];

        if ($includeSecretsMeta) {
            $payload = array_merge($payload, [
                'has_stored_api_user' => filled($account->api_user),
                'has_stored_api_key' => filled($account->api_key),
                'has_stored_subscription_key' => filled($account->subscription_key),
                'api_user_masked' => $this->maskSecret($resolved['api_user']),
                'api_key_masked' => $this->maskSecret($resolved['api_key']),
                'subscription_key_masked' => $this->maskSecret($resolved['subscription_key']),
                'key_source' => $isPlatform && ! $account->hasStoredCredentials() && $configured
                    ? 'environment'
                    : ($account->hasStoredCredentials() ? 'database' : null),
            ]);
        }

        return $payload;
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function updateAccount(PaymentProviderAccount $account, array $data): PaymentProviderAccount
    {
        foreach (['environment', 'country', 'currency', 'target_environment', 'callback_host'] as $field) {
            if (array_key_exists($field, $data) && $data[$field] !== null) {
                $account->{$field} = $field === 'environment'
                    ? ProviderEnvironment::from($data[$field])
                    : $data[$field];
            }
        }

        foreach (['api_user', 'api_key', 'subscription_key'] as $secret) {
            if (array_key_exists($secret, $data) && filled($data[$secret])) {
                $account->{$secret} = trim((string) $data[$secret]);
                $account->last_successful_token_at = null;
            }
        }

        if ($account->hasStoredCredentials() || ($account->account_type === ProviderAccountType::Platform && $this->isPlatformConfigured($account))) {
            $account->status = ProviderAccountStatus::Pending;
        } else {
            $account->status = ProviderAccountStatus::NotConfigured;
        }

        $account->last_error = null;
        $account->save();

        if ($account->account_type === ProviderAccountType::Platform) {
            $this->clearPlatformCache();
        }

        return $account->fresh();
    }

    public function requestTenantConnection(Tenant $tenant): PaymentProviderAccount
    {
        $this->assertTenantOwnGatewayAllowed($tenant);

        $account = $this->tenantAccount($tenant);
        if ($account->status === ProviderAccountStatus::NotConfigured) {
            $account->update(['status' => ProviderAccountStatus::Pending]);
        }

        return $account->fresh();
    }

    /** @return array{ok: bool, message: string, account: array<string, mixed>} */
    public function healthCheck(PaymentProviderAccount $account): array
    {
        $account->last_health_check_at = now();

        $resolved = $account->account_type === ProviderAccountType::Platform
            ? $this->resolvePlatformCredentials($account)
            : [
                'api_user' => $account->api_user,
                'api_key' => $account->api_key,
                'subscription_key' => $account->subscription_key,
            ];

        $configured = filled($resolved['api_user'])
            && filled($resolved['api_key'])
            && filled($resolved['subscription_key']);

        if (! $configured) {
            $account->status = ProviderAccountStatus::NotConfigured;
            $account->last_error = 'Missing MTN API credentials.';
            $account->save();

            if ($account->account_type === ProviderAccountType::Platform) {
                $this->clearPlatformCache();
            }

            return [
                'ok' => false,
                'message' => 'MTN credentials are not fully configured.',
                'account' => $this->payload($account->fresh()),
            ];
        }

        $env = config('integrations.payments.providers.mtn_momo', []);
        $tokenConfig = [
            'api_user' => $resolved['api_user'],
            'api_key' => $resolved['api_key'],
            'subscription_key' => $resolved['subscription_key'],
            'target_environment' => $account->target_environment ?: ($env['target_environment'] ?? 'sandbox'),
            'base_url' => rtrim((string) ($env['base_url'] ?? 'https://sandbox.momodeveloper.mtn.com'), '/'),
            'mock' => (bool) ($env['mock'] ?? false),
        ];

        try {
            app(MtnMomoTokenService::class)->getToken($tokenConfig);
            $account->status = ProviderAccountStatus::Connected;
            $account->last_successful_token_at = now();
            $account->last_error = null;
            $message = 'MTN credentials verified successfully.';
        } catch (\Throwable $e) {
            $account->status = ProviderAccountStatus::Failed;
            $account->last_error = $e->getMessage();
            $message = 'MTN token request failed: '.$e->getMessage();
        }

        $account->save();

        if ($account->account_type === ProviderAccountType::Platform) {
            $this->clearPlatformCache();
        }

        return [
            'ok' => $account->status === ProviderAccountStatus::Connected,
            'message' => $message,
            'account' => $this->payload($account->fresh()),
        ];
    }

    public function assertTenantOwnGatewayAllowed(Tenant $tenant): void
    {
        $settings = app(TenantPaymentSettingService::class)->forTenant($tenant);

        if ($settings->mode !== TenantPaymentMode::TenantOwnAccount) {
            throw ValidationException::withMessages([
                'mode' => 'Switch payment mode to “Connect My Own Gateway” before configuring a tenant MTN account.',
            ]);
        }
    }
}
