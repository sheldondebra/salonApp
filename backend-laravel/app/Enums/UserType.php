<?php

namespace App\Enums;

enum UserType: string
{
    case SuperAdmin = 'super_admin';
    case TenantOwner = 'tenant_owner';
    case Staff = 'staff';
    case Client = 'client';

    public function isPlatformUser(): bool
    {
        return $this === self::SuperAdmin;
    }
}
