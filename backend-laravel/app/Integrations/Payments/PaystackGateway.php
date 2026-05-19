<?php

namespace App\Integrations\Payments;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class PaystackGateway implements PaymentGatewayContract
{
    protected string $baseUrl = 'https://api.paystack.co';

    public function provider(): string
    {
        return 'paystack';
    }

    protected function secretKey(): ?string
    {
        return config('integrations.payments.providers.paystack.secret_key');
    }

    public function isConfigured(): bool
    {
        return filled($this->secretKey());
    }

    public function initializePayment(array $payload): array
    {
        $reference = $payload['reference'] ?? 'salon_'.Str::uuid();

        if (! $this->isConfigured()) {
            return $this->demoInitialize($reference, $payload);
        }

        $amount = (int) $payload['amount_cents'];
        $currency = strtoupper($payload['currency'] ?? 'USD');

        $response = Http::withToken($this->secretKey())
            ->post("{$this->baseUrl}/transaction/initialize", [
                'email' => $payload['email'],
                'amount' => $amount,
                'currency' => $currency,
                'reference' => $reference,
                'callback_url' => $payload['callback_url'] ?? config('billing.frontend_callback'),
                'metadata' => $payload['metadata'] ?? [],
            ])
            ->throw()
            ->json();

        $data = $response['data'] ?? [];

        return [
            'provider' => $this->provider(),
            'reference' => $data['reference'] ?? $reference,
            'authorization_url' => $data['authorization_url'],
            'access_code' => $data['access_code'] ?? null,
            'raw' => $response,
        ];
    }

    public function verifyPayment(string $reference): array
    {
        if (! $this->isConfigured()) {
            return [
                'status' => 'success',
                'provider_reference' => $reference,
                'amount_cents' => 0,
                'currency' => config('billing.currency'),
                'raw' => ['demo' => true],
            ];
        }

        $response = Http::withToken($this->secretKey())
            ->get("{$this->baseUrl}/transaction/verify/{$reference}")
            ->throw()
            ->json();

        $data = $response['data'] ?? [];

        return [
            'status' => ($data['status'] ?? '') === 'success' ? 'success' : 'failed',
            'provider_reference' => $data['reference'] ?? $reference,
            'amount_cents' => (int) ($data['amount'] ?? 0),
            'currency' => $data['currency'] ?? config('billing.currency'),
            'raw' => $response,
        ];
    }

    public function verifyWebhookSignature(string $payload, ?string $signature): bool
    {
        $secret = config('integrations.payments.providers.paystack.webhook_secret');

        if (! $secret || ! $signature) {
            return false;
        }

        return hash_equals($signature, hash_hmac('sha512', $payload, $secret));
    }

    public function handleWebhook(array $payload): ?string
    {
        $event = $payload['event'] ?? null;

        if ($event === 'charge.success') {
            return $payload['data']['reference'] ?? null;
        }

        return null;
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    protected function demoInitialize(string $reference, array $payload): array
    {
        $callback = $payload['callback_url'] ?? config('billing.frontend_callback');
        $url = $callback.(str_contains($callback, '?') ? '&' : '?').'reference='.$reference.'&demo=1';

        return [
            'provider' => $this->provider(),
            'reference' => $reference,
            'authorization_url' => $url,
            'demo_mode' => true,
        ];
    }
}
