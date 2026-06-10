<?php

namespace App\Enums;

enum SettlementSchedule: string
{
    case Manual = 'manual';
    case Daily = 'daily';
    case Weekly = 'weekly';
    case Monthly = 'monthly';

    /** @return list<string> */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
