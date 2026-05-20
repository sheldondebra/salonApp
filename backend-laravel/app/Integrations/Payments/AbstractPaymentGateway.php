<?php

namespace App\Integrations\Payments;

use Illuminate\Support\Str;

/**
 * Shared helpers for Paystack and Flutterwave gateways (demo mode + callbacks).
 */
abstract class AbstractPaymentGateway implements PaymentGatewayContract
{
    abstract public function provider(): string;

    abstract protected function secretKey(): ?string;

    public function isConfigured(): bool
    {
        return filled($this->secretKey());
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    protected function demoInitialize(string $reference, array $payload): array
    {
        $callback = $payload['callback_url'] ?? config('billing.frontend_callback');
        $separator = str_contains($callback, '?') ? '&' : '?';
        $url = $callback.$separator.http_build_query([
            'reference' => $reference,
            'demo' => '1',
        ]);

        return [
            'provider' => $this->provider(),
            'reference' => $reference,
            'authorization_url' => $url,
            'demo_mode' => true,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    protected function demoVerifySuccess(string $reference): array
    {
        return [
            'status' => 'success',
            'provider_reference' => $reference,
            'amount_cents' => 0,
            'currency' => config('billing.currency', 'GHS'),
            'raw' => ['demo' => true],
        ];
    }

    protected function newReference(string $prefix = 'salon'): string
    {
        return $prefix.'_'.Str::uuid();
    }
}
