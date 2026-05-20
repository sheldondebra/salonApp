<?php

namespace App\Integrations\Sms;

use Illuminate\Support\Facades\Http;

class MNotifyGateway implements SmsGatewayContract
{
    public function provider(): string
    {
        return 'mnotify';
    }

    protected function apiKey(): ?string
    {
        $key = config('integrations.sms.providers.mnotify.api_key');

        return filled($key) ? $key : null;
    }

    protected function senderId(): string
    {
        return config('integrations.sms.providers.mnotify.sender_id') ?: 'SalonApp';
    }

    public function isConfigured(): bool
    {
        return filled($this->apiKey());
    }

    public function fetchBalance(): array
    {
        if (! $this->isConfigured()) {
            return [
                'ok' => false,
                'balance' => null,
                'message' => 'MNotify API key not configured. Add MNOTIFY_API_KEY to backend .env.',
                'code' => 'not_configured',
            ];
        }

        $balanceUrl = rtrim((string) config('integrations.sms.providers.mnotify.balance_url'), '/');

        try {
            $response = Http::timeout(20)->get($balanceUrl, [
                'key' => $this->apiKey(),
            ]);
        } catch (\Throwable $e) {
            return [
                'ok' => false,
                'balance' => null,
                'message' => 'Could not reach MNotify: '.$e->getMessage(),
                'code' => 'network_error',
            ];
        }

        $body = $response->body();
        $json = $response->json();

        if (! $response->successful()) {
            return [
                'ok' => false,
                'balance' => null,
                'message' => $this->humanizeBalanceError($json, $body, $response->status()),
                'code' => 'http_error',
                'http_status' => $response->status(),
            ];
        }

        $balance = $this->parseBalanceFromResponse($json, $body);

        if ($balance === null) {
            return [
                'ok' => false,
                'balance' => null,
                'message' => 'MNotify returned an unexpected balance response. Check MNOTIFY_BALANCE_URL.',
                'code' => 'parse_error',
                'http_status' => $response->status(),
            ];
        }

        return [
            'ok' => true,
            'balance' => $balance,
            'message' => 'Balance synced from MNotify.',
            'code' => 'ok',
            'http_status' => $response->status(),
        ];
    }

    /**
     * @param  array<string, mixed>|null  $json
     */
    protected function parseBalanceFromResponse(?array $json, string $body): ?int
    {
        if (is_array($json)) {
            foreach (['balance', 'credit', 'credits', 'sms_balance', 'remaining'] as $key) {
                if (isset($json[$key]) && is_numeric($json[$key])) {
                    return (int) $json[$key];
                }
            }

            if (isset($json['data']) && is_array($json['data'])) {
                foreach (['balance', 'credit', 'credits'] as $key) {
                    if (isset($json['data'][$key]) && is_numeric($json['data'][$key])) {
                        return (int) $json['data'][$key];
                    }
                }
            }

            if (isset($json['status']) && in_array($json['status'], ['success', '1000', 1000, 'ok'], true)) {
                foreach ($json as $value) {
                    if (is_numeric($value)) {
                        return (int) $value;
                    }
                }
            }
        }

        if (preg_match('/\d+/', trim($body), $matches)) {
            return (int) $matches[0];
        }

        return null;
    }

    /**
     * @param  array<string, mixed>|null  $json
     */
    protected function humanizeBalanceError(?array $json, string $body, int $status): string
    {
        if (is_array($json)) {
            $message = $json['message'] ?? $json['error'] ?? $json['status'] ?? null;
            if (is_string($message) && $message !== '') {
                return $message;
            }
        }

        $trimmed = trim($body);
        if ($trimmed !== '') {
            return mb_substr($trimmed, 0, 200);
        }

        return "MNotify balance request failed (HTTP {$status}).";
    }

    public function send(string $to, string $message, array $options = []): array
    {
        $recipient = $this->normalizePhone($to);

        if (! $this->isConfigured()) {
            return [
                'provider' => $this->provider(),
                'status' => 'sent',
                'to' => $recipient,
                'demo' => true,
                'message' => 'MNotify API key not configured — logged only.',
            ];
        }

        $baseUrl = rtrim(config('integrations.sms.providers.mnotify.base_url'), '/');

        $response = Http::timeout(30)
            ->asForm()
            ->post("{$baseUrl}/sms/quick", [
                'key' => $this->apiKey(),
                'to' => $recipient,
                'msg' => $message,
                'sender_id' => $options['sender_id'] ?? $this->senderId(),
            ]);

        $body = $response->json() ?? [];

        $success = $response->successful()
            && in_array($body['status'] ?? $body['code'] ?? null, ['success', '1000', 1000, 'ok'], true);

        return [
            'provider' => $this->provider(),
            'status' => $success ? 'sent' : 'failed',
            'to' => $recipient,
            'http_status' => $response->status(),
            'raw' => $body,
        ];
    }

    protected function normalizePhone(string $phone): string
    {
        $digits = preg_replace('/\D+/', '', $phone) ?? '';

        if (str_starts_with($digits, '0')) {
            $digits = '233'.substr($digits, 1);
        }

        return $digits;
    }
}
