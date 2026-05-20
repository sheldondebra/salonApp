<?php

namespace App\Mail;

use App\Models\BillingInvoice;
use App\Models\PlatformSubscription;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class BillingInvoiceMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public User $user,
        public PlatformSubscription $subscription,
        public BillingInvoice $invoice,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Your SalonApp invoice '.$this->invoice->invoice_number,
        );
    }

    public function content(): Content
    {
        $planName = $this->subscription->metadata['plan_name'] ?? $this->subscription->plan_id;

        return new Content(
            view: 'emails.billing-invoice-html',
            with: [
                'user' => $this->user,
                'invoice' => $this->invoice,
                'planName' => $planName,
                'amountFormatted' => number_format($this->invoice->amount_cents / 100, 2),
                'ctaUrl' => config('billing.frontend_url').'/onboarding',
            ],
        );
    }
}
