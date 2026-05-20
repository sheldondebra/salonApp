<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class OtpMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $code,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Your verification code — SalonApp',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.otp-html',
            with: [
                'code' => $this->code,
                'expiresMinutes' => (int) config('notifications.otp.expires_minutes', 10),
            ],
        );
    }
}
