<?php

namespace App\Services;

use App\Models\SmsProviderBalance;
use Illuminate\Support\Facades\Cache;

class MnotifyConfigService
{
    private const PROVIDER = 'mnotify';

    private const CACHE_KEY = 'mnotify_platform_config';

    /**
     * @return array{api_key: ?string, sender_id: string, base_url: string, balance_url: string}
     */
    public function resolve(): array
    {
        return Cache::remember(self::CACHE_KEY, 300, function () {
            $defaults = config('integrations.sms.providers.mnotify');
            $row = SmsProviderBalance::query()->where('provider', self::PROVIDER)->first();

            $apiKey = filled($row?->api_key) ? $row->api_key : ($defaults['api_key'] ?? null);
            $senderId = filled($row?->sender_id) ? $row->sender_id : ($defaults['sender_id'] ?? 'SalonApp');
            $baseUrl = filled($row?->base_url) ? $row->base_url : ($defaults['base_url'] ?? 'https://api.mnotify.com/api');
            $balanceUrl = filled($row?->balance_url) ? $row->balance_url : ($defaults['balance_url'] ?? 'https://apps.mnotify.net/smsapi/balance');

            return [
                'api_key' => filled($apiKey) ? $apiKey : null,
                'sender_id' => (string) $senderId,
                'base_url' => rtrim((string) $baseUrl, '/'),
                'balance_url' => rtrim((string) $balanceUrl, '/'),
            ];
        });
    }

    public function clearCache(): void
    {
        Cache::forget(self::CACHE_KEY);
    }

    public function apiKey(): ?string
    {
        return $this->resolve()['api_key'];
    }

    public function isConfigured(): bool
    {
        return filled($this->apiKey());
    }

    public function record(): SmsProviderBalance
    {
        return SmsProviderBalance::query()->firstOrCreate(
            ['provider' => self::PROVIDER],
            ['balance_credits' => 0, 'status' => 'pending_sync']
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function settingsPayload(): array
    {
        $row = $this->record();
        $configured = $this->isConfigured();
        $key = $this->apiKey();
        $fromDatabase = filled($row->api_key);

        return [
            'provider' => self::PROVIDER,
            'sender_id' => $this->resolve()['sender_id'],
            'base_url' => $this->resolve()['base_url'],
            'balance_url' => $this->resolve()['balance_url'],
            'api_configured' => $configured,
            'has_stored_key' => $fromDatabase,
            'key_source' => $fromDatabase ? 'database' : (filled(config('integrations.sms.providers.mnotify.api_key')) ? 'environment' : null),
            'api_key_masked' => $key ? $this->maskKey($key) : null,
            'connected' => $configured && $row->status === 'ok' && $row->verified_at !== null,
            'status' => $row->status,
            'balance_credits' => (int) $row->balance_credits,
            'last_synced_at' => $row->last_synced_at?->toIso8601String(),
            'verified_at' => $row->verified_at?->toIso8601String(),
            'last_error' => ($row->meta ?? [])['last_error'] ?? null,
        ];
    }

    public function maskKey(string $key): string
    {
        $len = strlen($key);
        if ($len <= 4) {
            return str_repeat('•', 8);
        }

        return str_repeat('•', min(16, max(8, $len - 4))).substr($key, -4);
    }

    /**
     * @param  array{api_key?: ?string, sender_id?: ?string, base_url?: ?string, balance_url?: ?string}  $data
     */
    public function updateSettings(array $data): SmsProviderBalance
    {
        $row = $this->record();

        if (array_key_exists('api_key', $data) && filled($data['api_key'])) {
            $row->api_key = trim((string) $data['api_key']);
            $row->verified_at = null;
            $row->status = 'pending_sync';
        }

        if (array_key_exists('sender_id', $data) && $data['sender_id'] !== null) {
            $row->sender_id = trim((string) $data['sender_id']) ?: null;
        }

        if (array_key_exists('base_url', $data) && $data['base_url'] !== null) {
            $row->base_url = trim((string) $data['base_url']) ?: null;
        }

        if (array_key_exists('balance_url', $data) && $data['balance_url'] !== null) {
            $row->balance_url = trim((string) $data['balance_url']) ?: null;
        }

        $row->save();
        $this->clearCache();

        return $row->fresh();
    }

    public function markVerified(): void
    {
        $row = $this->record();
        $row->update([
            'verified_at' => now(),
            'status' => 'ok',
            'meta' => array_merge($row->meta ?? [], ['last_error' => null]),
        ]);
    }
}
