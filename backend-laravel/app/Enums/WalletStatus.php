<?php

namespace App\Enums;

enum WalletStatus: string
{
    case Active = 'active';
    case Frozen = 'frozen';

    /** @return list<string> */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
