<?php

namespace App\Enums;

enum TenantDomainType: string
{
    case Custom = 'custom';
    case Workplace = 'workplace';

    public function isCustom(): bool
    {
        return $this === self::Custom;
    }
}
