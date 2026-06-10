<?php

namespace App\Enums;

enum PaymentGateway: string
{
    case Paystack = 'paystack';
    case Flutterwave = 'flutterwave';
    case MtnMomo = 'mtn_momo';

    /** @return list<string> */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
