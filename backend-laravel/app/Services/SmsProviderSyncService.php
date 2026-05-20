<?php

namespace App\Services;

use App\Integrations\Sms\SmsGatewayContract;
use App\Models\SmsProviderBalance;
use App\Models\SmsProviderSyncLog;
use Illuminate\Support\Facades\Log;

class SmsProviderSyncService
{
    public function __construct(
        protected SmsGatewayContract $gateway,
        protected MnotifyConfigService $mnotifyConfig,
    ) {}

    /**
     * @return array{
     *     provider: array<string, mixed>,
     *     sync: array{status: string, message: string, balance_before: int, balance_after: ?int}
     * }
     */
    public function sync(): array
    {
        $provider = SmsProviderBalance::query()->firstOrCreate(
            ['provider' => $this->gateway->provider()],
            ['balance_credits' => 0, 'status' => 'pending_sync']
        );

        $balanceBefore = (int) $provider->balance_credits;
        $result = $this->gateway->fetchBalance();

        if ($result['ok'] && $result['balance'] !== null) {
            $provider->update([
                'balance_credits' => $result['balance'],
                'status' => 'ok',
                'last_synced_at' => now(),
                'meta' => array_merge($provider->meta ?? [], [
                    'last_error' => null,
                    'last_sync_message' => $result['message'],
                ]),
            ]);

            $this->logSync($provider->provider, 'success', $balanceBefore, $result['balance'], $result['message']);
            $this->mnotifyConfig->markVerified();

            return [
                'provider' => $this->providerPayload($provider->fresh()),
                'sync' => [
                    'status' => 'success',
                    'message' => $result['message'],
                    'balance_before' => $balanceBefore,
                    'balance_after' => $result['balance'],
                ],
            ];
        }

        $status = ($result['code'] ?? '') === 'not_configured' ? 'not_configured' : 'error';

        $provider->update([
            'status' => $status,
            'meta' => array_merge($provider->meta ?? [], [
                'last_error' => $result['message'],
                'last_sync_message' => $result['message'],
            ]),
        ]);

        $this->logSync($provider->provider, 'failed', $balanceBefore, null, $result['message'], [
            'code' => $result['code'] ?? null,
            'http_status' => $result['http_status'] ?? null,
        ]);

        Log::warning('MNotify provider balance sync failed', [
            'message' => $result['message'],
            'code' => $result['code'] ?? null,
        ]);

        return [
            'provider' => $this->providerPayload($provider->fresh()),
            'sync' => [
                'status' => 'failed',
                'message' => $result['message'],
                'balance_before' => $balanceBefore,
                'balance_after' => null,
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function providerPayload(?SmsProviderBalance $provider = null): array
    {
        $provider ??= SmsProviderBalance::query()->firstOrCreate(
            ['provider' => $this->gateway->provider()],
            ['balance_credits' => 0, 'status' => 'pending_sync']
        );

        $settings = $this->mnotifyConfig->settingsPayload();
        $recentFailed = SmsProviderSyncLog::query()
            ->where('provider', $provider->provider)
            ->where('status', 'failed')
            ->where('created_at', '>=', now()->subDay())
            ->count();

        return array_merge($settings, [
            'recent_failed_syncs' => $recentFailed,
        ]);
    }

    /**
     * @param  array<string, mixed>|null  $payload
     */
    protected function logSync(
        string $provider,
        string $status,
        int $balanceBefore,
        ?int $balanceAfter,
        string $message,
        ?array $payload = null,
    ): void {
        SmsProviderSyncLog::query()->create([
            'provider' => $provider,
            'status' => $status,
            'balance_before' => $balanceBefore,
            'balance_after' => $balanceAfter,
            'message' => $message,
            'payload' => $payload,
            'created_at' => now(),
        ]);
    }
}
