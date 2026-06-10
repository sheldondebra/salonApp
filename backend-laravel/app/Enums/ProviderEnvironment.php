<?php

namespace App\Enums;

enum ProviderEnvironment: string
{
    case Sandbox = 'sandbox';
    case Production = 'production';

    /** @return list<string> */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
