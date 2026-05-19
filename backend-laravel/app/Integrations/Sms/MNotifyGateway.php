<?php

namespace App\Integrations\Sms;

class MNotifyGateway implements SmsGatewayContract
{
    public function provider(): string
    {
        return 'mnotify';
    }

    public function send(string $to, string $message, array $options = []): array
    {
        return [
            'provider' => $this->provider(),
            'status' => 'not_implemented',
            'to' => $to,
        ];
    }
}
