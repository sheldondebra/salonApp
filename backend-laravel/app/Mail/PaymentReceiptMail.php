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
        return new Content(
            markdown: 'emails.payment-receipt',
        );
    }
}
