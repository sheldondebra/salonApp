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
