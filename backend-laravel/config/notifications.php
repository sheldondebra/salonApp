<?php

return [

    'defaults' => [
        'email_enabled' => true,
        'sms_enabled' => true,
        'booking_confirmation_email' => true,
        'booking_confirmation_sms' => true,
        'booking_reminder_email' => true,
        'booking_reminder_sms' => true,
        'booking_cancellation_email' => true,
        'booking_cancellation_sms' => true,
        'payment_alert_email' => true,
        'payment_alert_sms' => true,
        'marketing_sms_enabled' => false,
    ],

    'otp' => [
        'length' => 6,
        'expires_minutes' => 10,
        'cache_prefix' => 'auth_otp:',
    ],

    'reminders' => [
        'hours_before' => 24,
    ],

];
