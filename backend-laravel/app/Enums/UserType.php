<?php

namespace App\Enums;

enum UserType: string
{
    case SuperAdmin = 'super_admin';
    case OfficeAdmin = 'office_admin';
    case TenantOwner = 'tenant_owner';
    case Manager = 'manager';
    case Staff = 'staff';
    case Client = 'client';

    public function isPlatformUser(): bool
    {
        return in_array($this, [self::SuperAdmin, self::OfficeAdmin], true);
    }
}
