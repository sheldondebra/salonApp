<?php

namespace App\Enums;

enum FeaturedListingStatus: string
{
    case Scheduled = 'scheduled';
    case Active = 'active';
    case Paused = 'paused';
    case Expired = 'expired';

    /** @return list<string> */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
