<?php

namespace App\Integrations\Payments;

class FlutterwaveGateway implements PaymentGatewayContract
{
    public function provider(): string
    {
        return 'flutterwave';
    }

    public function initializePayment(array $payload): array
    {
        return [
            'provider' => $this->provider(),
            'status' => 'not_implemented',
        ];
    }

    public function verifyWebhookSignature(string $payload, ?string $signature): bool
    {
        return false;
    }
}
