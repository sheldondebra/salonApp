<?php

namespace App\Integrations\Sms;

interface SmsGatewayContract
{
    public function provider(): string;

    public function isConfigured(): bool;

    /**
     * @return array{ok: bool, balance: ?int, message: string, code?: string, http_status?: int}
     */
    public function fetchBalance(): array;

    /**
     * @param  array<string, mixed>  $options
     * @return array<string, mixed>
     */
    public function send(string $to, string $message, array $options = []): array;
}
