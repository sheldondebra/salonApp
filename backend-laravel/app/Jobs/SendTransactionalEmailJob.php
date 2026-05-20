<?php

namespace App\Jobs;

use Illuminate\Contracts\Mail\Mailable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Mail;

class SendTransactionalEmailJob implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public function __construct(
        public string $to,
        public Mailable $mailable,
    ) {}

    public function handle(): void
    {
        Mail::to($this->to)->send($this->mailable);
    }
}
