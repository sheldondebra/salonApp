<?php

namespace App\Enums;

enum CouponScope: string
{
    case Subscription = 'subscription';
    case Booking = 'booking';
    case Both = 'both';

    public function allowsSubscription(): bool
    {
        return $this === self::Subscription || $this === self::Both;
    }

    public function allowsBooking(): bool
    {
        return $this === self::Booking || $this === self::Both;
    }
}
