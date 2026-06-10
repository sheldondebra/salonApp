<?php

namespace App\Enums;

enum TaxMode: string
{
    case Inclusive = 'inclusive';
    case Exclusive = 'exclusive';

    /** @return list<string> */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
