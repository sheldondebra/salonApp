<?php

namespace App\Enums;

enum FinanceRefundMethod: string
{
    case Cash = 'cash';
    case MobileMoney = 'mobile_money';
    case Gateway = 'gateway';
    case Original = 'original';

    /** @return list<string> */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
