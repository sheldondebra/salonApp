<?php

namespace App\Integrations\Payments;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class FlutterwaveGateway implements PaymentGatewayContract
{
    protected string $baseUrl = 'https://api.flutterwave.com/v3';

    public function provider(): string
    {
        return 'flutterwave';
    }

    protected function secretKey(): ?string
    {
        return config('integrations.payments.providers.flutterwave.secret_key');
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

        $response = Http::withToken($this->secretKey())
            ->post("{$this->baseUrl}/payments", [
                'tx_ref' => $reference,
                'amount' => round(((int) $payload['amount_cents']) / 100, 2),
                'currency' => strtoupper($payload['currency'] ?? 'USD'),
                'redirect_url' => $payload['callback_url'] ?? config('billing.frontend_callback'),
                'customer' => [
                    'email' => $payload['email'],
                    'name' => $payload['name'] ?? 'SalonApp Customer',
                ],
                'meta' => $payload['metadata'] ?? [],
            ])
            ->throw()
            ->json();

        $data = $response['data'] ?? [];

        return [
            'provider' => $this->provider(),
            'reference' => $data['tx_ref'] ?? $reference,
            'authorization_url' => $data['link'] ?? null,
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
            ->get("{$this->baseUrl}/transactions/verify_by_reference", ['tx_ref' => $reference])
            ->throw()
            ->json();

        $data = $response['data'] ?? [];

        return [
            'status' => ($data['status'] ?? '') === 'successful' ? 'success' : 'failed',
            'provider_reference' => $data['tx_ref'] ?? $reference,
            'amount_cents' => (int) round(((float) ($data['amount'] ?? 0)) * 100),
            'currency' => $data['currency'] ?? config('billing.currency'),
            'raw' => $response,
        ];
    }

    public function verifyWebhookSignature(string $payload, ?string $signature): bool
    {
        $secret = config('integrations.payments.providers.flutterwave.webhook_secret');

        if (! $secret || ! $signature) {
            return false;
        }

        return hash_equals($secret, $signature);
    }

    public function handleWebhook(array $payload): ?string
    {
        $event = $payload['event'] ?? null;

        if ($event === 'charge.completed' && ($payload['data']['status'] ?? '') === 'successful') {
            return $payload['data']['tx_ref'] ?? null;
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
