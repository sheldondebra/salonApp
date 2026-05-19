<?php

namespace App\Integrations\Payments;

interface PaymentGatewayContract
{
    public function provider(): string;

    /**
     * @param  array<string, mixed>  $payload  email, amount_cents, currency, reference, callback_url, metadata
     * @return array<string, mixed>  authorization_url, reference, access_code?, raw
     */
    public function initializePayment(array $payload): array;

    /**
     * @return array<string, mixed>  status: success|failed, amount_cents, currency, provider_reference, raw
     */
    public function verifyPayment(string $reference): array;

    public function verifyWebhookSignature(string $payload, ?string $signature): bool;

    /**
     * @param  array<string, mixed>  $payload  decoded webhook body
     */
    public function handleWebhook(array $payload): ?string;
}
