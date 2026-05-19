<?php

namespace App\Enums;

enum RoleName: string
{
    case SuperAdmin = 'super_admin';
    case OfficeAdmin = 'office_admin';
    case TenantOwner = 'tenant_owner';
    case Manager = 'manager';
    case Staff = 'staff';
    case Client = 'client';

    public function label(): string
    {
        return match ($this) {
            self::SuperAdmin => 'Super Admin',
            self::OfficeAdmin => 'Office Admin',
            self::TenantOwner => 'Tenant Owner',
            self::Manager => 'Manager',
            self::Staff => 'Staff',
            self::Client => 'Client',
        };
    }
}
