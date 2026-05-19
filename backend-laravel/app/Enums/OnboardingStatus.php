<?php

namespace App\Enums;

enum OnboardingStatus: string
{
    case Complete = 'complete';
    case PaymentPending = 'payment_pending';
    case Paid = 'paid';
    case Onboarded = 'onboarded';

    public function needsPayment(): bool
    {
        return $this === self::PaymentPending;
    }

    public function canOnboard(): bool
    {
        return $this === self::Paid;
    }
}
