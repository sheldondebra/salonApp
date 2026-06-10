<?php

namespace App\Enums;

enum TenantPaymentMode: string
{
    case PlatformAccount = 'platform_account';
    case TenantOwnAccount = 'tenant_own_account';
    case Disabled = 'disabled';

    /** @return list<string> */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
