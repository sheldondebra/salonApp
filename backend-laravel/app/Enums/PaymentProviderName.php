<?php

namespace App\Enums;

enum PaymentProviderName: string
{
    case MtnMomo = 'mtn_momo';
    case Paystack = 'paystack';
    case Flutterwave = 'flutterwave';

    /** @return list<string> */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
