<?php

namespace App\Jobs;

use App\Models\SmsMessage;
use App\Services\SmsService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class SendSmsJob implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public function __construct(
        public int $smsMessageId,
    ) {}

    public function handle(SmsService $sms): void
    {
        $log = SmsMessage::query()->find($this->smsMessageId);

        if (! $log) {
            return;
        }

        $sms->deliver($log);
    }
}
