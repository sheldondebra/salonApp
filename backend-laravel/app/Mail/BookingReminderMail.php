<?php

namespace App\Mail;

use App\Models\Appointment;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class BookingReminderMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Appointment $appointment,
    ) {}

    public function envelope(): Envelope
    {
        $salon = $this->appointment->tenant?->name ?? 'SalonApp';

        return new Envelope(
            subject: "Reminder: upcoming appointment — {$salon}",
        );
    }

    public function content(): Content
    {
        $this->appointment->loadMissing(['service', 'staffMember', 'tenant', 'client']);

        return new Content(
            view: 'emails.booking-reminder-html',
            with: [
                'appointment' => $this->appointment,
                'clientName' => $this->appointment->client?->name ?? 'there',
                'salonName' => $this->appointment->tenant?->name ?? 'your salon',
                'serviceName' => $this->appointment->service?->name ?? 'Appointment',
                'when' => $this->appointment->starts_at->format('l, M j, Y \a\t g:i A'),
            ],
        );
    }
}
