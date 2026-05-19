<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RolesAndPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $permissions = [
            'tenants.view',
            'tenants.manage',
            'bookings.view',
            'bookings.manage',
            'services.view',
            'services.manage',
            'staff.view',
            'staff.manage',
            'clients.view',
            'clients.manage',
            'analytics.view',
            'settings.manage',
            'billing.manage',
        ];

        foreach ($permissions as $permission) {
            Permission::findOrCreate($permission, 'sanctum');
        }

        $superAdmin = Role::findOrCreate('super_admin', 'sanctum');
        $superAdmin->syncPermissions(Permission::all());

        $tenantRoles = [
            'tenant_owner' => $permissions,
            'manager' => [
                'bookings.view', 'bookings.manage', 'services.view', 'services.manage',
                'staff.view', 'staff.manage', 'clients.view', 'clients.manage', 'analytics.view',
            ],
            'staff' => ['bookings.view', 'bookings.manage', 'services.view', 'clients.view'],
            'client' => ['bookings.view'],
        ];

        foreach ($tenantRoles as $roleName => $rolePermissions) {
            $role = Role::findOrCreate($roleName, 'sanctum');
            $role->syncPermissions($rolePermissions);
        }
    }
}
