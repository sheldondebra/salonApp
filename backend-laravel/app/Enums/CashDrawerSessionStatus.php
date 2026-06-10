<?php

namespace App\Enums;

enum CashDrawerSessionStatus: string
{
    case Open = 'open';
    case Closed = 'closed';
    case Discrepancy = 'discrepancy';

    /** @return list<string> */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
