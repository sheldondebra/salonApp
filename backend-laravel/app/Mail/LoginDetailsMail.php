<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class LoginDetailsMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public User $user,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Your SalonApp login & getting started guide',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.login-details-html',
            with: [
                'user' => $this->user,
                'loginUrl' => config('billing.frontend_url').'/login',
            ],
        );
    }
}
