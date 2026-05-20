<?php

namespace App\Enums;

enum SmsNotificationType: string
{
    case Otp = 'otp';
    case BookingConfirmation = 'booking_confirmation';
    case BookingReminder = 'booking_reminder';
    case BookingCancellation = 'booking_cancellation';
    case PaymentAlert = 'payment_alert';
    case Marketing = 'marketing';
    case General = 'general';
}
