<?php

namespace App\Enums;

enum AbandonedBookingStatus: string
{
    case Draft = 'draft';
    case Abandoned = 'abandoned';
    case Recovered = 'recovered';
    case Archived = 'archived';

    /** @return list<string> */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
