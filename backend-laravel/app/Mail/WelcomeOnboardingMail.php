<?php

namespace App\Mail;

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class WelcomeOnboardingMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public User $user,
        public Tenant $tenant,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Welcome to SalonApp — '.$this->tenant->name.' is live',
        );
    }

    public function content(): Content
    {
        $base = config('billing.frontend_url');

        return new Content(
            view: 'emails.welcome-onboarding-html',
            with: [
                'user' => $this->user,
                'tenant' => $this->tenant,
                'dashboardUrl' => $base.'/'.$this->tenant->slug.'/dashboard',
                'bookingUrl' => $base.'/'.$this->tenant->slug.'/book',
            ],
        );
    }
}
