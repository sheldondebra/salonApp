<?php

namespace App\Enums;

enum ProviderAccountStatus: string
{
    case NotConfigured = 'not_configured';
    case Pending = 'pending';
    case Connected = 'connected';
    case Failed = 'failed';
    case Disabled = 'disabled';
    case Blocked = 'blocked';

    /** @return list<string> */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
