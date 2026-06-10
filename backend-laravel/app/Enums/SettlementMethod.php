<?php

namespace App\Enums;

enum SettlementMethod: string
{
    case Momo = 'momo';
    case Bank = 'bank';
    case Cash = 'cash';
    case Other = 'other';

    /** @return list<string> */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
