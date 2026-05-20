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

class PaymentReceiptMail extends Mailable
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
            subject: 'Payment receipt — SalonApp',
        );
    }

    public function content(): Content
    {
        $planName = $this->subscription->metadata['plan_name'] ?? $this->subscription->plan_id;

        return new Content(
            view: 'emails.payment-receipt-html',
            with: [
                'user' => $this->user,
                'invoice' => $this->invoice,
                'planName' => $planName,
                'amountFormatted' => number_format($this->invoice->amount_cents / 100, 2),
                'paidAt' => $this->invoice->paid_at?->format('M j, Y g:i A') ?? now()->format('M j, Y'),
                'ctaUrl' => config('billing.frontend_url').'/onboarding',
            ],
        );
    }
}
