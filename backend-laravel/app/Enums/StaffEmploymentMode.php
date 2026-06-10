<?php

namespace App\Enums;

enum StaffEmploymentMode: string
{
    case Employed = 'employed';
    case SelfEmployed = 'self_employed';
    case ChairRental = 'chair_rental';

    /** @return list<string> */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
