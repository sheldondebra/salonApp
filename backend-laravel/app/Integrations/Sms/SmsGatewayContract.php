<?php

namespace App\Integrations\Sms;

interface SmsGatewayContract
{
    public function provider(): string;

    /**
     * @param  array<string, mixed>  $options
     * @return array<string, mixed>
     */
    public function send(string $to, string $message, array $options = []): array;
}
