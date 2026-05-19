<?php

namespace App\Enums;

enum PortalType: string
{
    case Marketing = 'marketing';
    case SuperAdmin = 'super_admin';
    case Tenant = 'tenant';
    case Staff = 'staff';
    case Client = 'client';
}
