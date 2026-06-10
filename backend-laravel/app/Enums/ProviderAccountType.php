<?php

namespace App\Enums;

enum ProviderAccountType: string
{
    case Platform = 'platform';
    case Tenant = 'tenant';

    /** @return list<string> */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
