<?php

namespace App\Enums;

enum TaxAppliesTo: string
{
    case All = 'all';
    case Services = 'services';
    case Products = 'products';

    /** @return list<string> */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
