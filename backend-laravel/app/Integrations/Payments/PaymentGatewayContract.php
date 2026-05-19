<?php

namespace App\Integrations\Payments;

interface PaymentGatewayContract
{
    public function provider(): string;

    /**
     * Initialize a payment session (foundation — implement later).
     *
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    public function initializePayment(array $payload): array;

    /**
     * Verify webhook signature from provider.
     */
    public function verifyWebhookSignature(string $payload, ?string $signature): bool;
}
