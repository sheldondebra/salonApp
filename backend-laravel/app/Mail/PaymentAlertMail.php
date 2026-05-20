<?php

namespace App\Mail;

use App\Models\Appointment;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PaymentAlertMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Appointment $appointment,
        public int $amountCents,
        public string $currency,
    ) {}

    public function envelope(): Envelope
    {
        $salon = $this->appointment->tenant?->name ?? 'SalonApp';

        return new Envelope(
            subject: "Payment received — {$salon}",
        );
    }

    public function content(): Content
    {
        $this->appointment->loadMissing(['service', 'tenant', 'client']);

        return new Content(
            view: 'emails.payment-alert-html',
            with: [
                'appointment' => $this->appointment,
                'clientName' => $this->appointment->client?->name ?? 'there',
                'salonName' => $this->appointment->tenant?->name ?? 'your salon',
                'serviceName' => $this->appointment->service?->name ?? 'your appointment',
                'amountFormatted' => number_format($this->amountCents / 100, 2),
                'currency' => $this->currency,
            ],
        );
    }
}
