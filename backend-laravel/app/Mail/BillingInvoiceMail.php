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
        return new Content(
            markdown: 'emails.billing-invoice',
        );
    }
}
