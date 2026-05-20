<?php

namespace App\Enums;

enum PaymentPurpose: string
{
    case Subscription = 'subscription';
    case Booking = 'booking';
    case Deposit = 'deposit';
}
