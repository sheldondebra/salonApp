<?php

namespace Database\Seeders;

use App\Enums\RoleName;
use App\Support\PermissionList;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RolesAndPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        $registrar = app(PermissionRegistrar::class);
        $registrar->forgetCachedPermissions();
        // Global role/permission definitions are not tenant-scoped (NULL team).
        $registrar->setPermissionsTeamId(null);

        $guard = config('permissions.guard', 'sanctum');

        $all = PermissionList::all();

        Permission::query()
            ->where('guard_name', $guard)
            ->whereNotIn('name', $all)
            ->delete();

        foreach ($all as $permission) {
            Permission::findOrCreate($permission, $guard);
        }

        $matrix = PermissionList::roleMatrix();

        foreach (RoleName::cases() as $roleName) {
            $role = Role::findOrCreate($roleName->value, $guard);
            $permissions = $matrix[$roleName->value] ?? [];
            $role->syncPermissions($permissions);
        }

        $staffSettingsRoles = [RoleName::TenantOwner->value, RoleName::Manager->value];
        foreach ($staffSettingsRoles as $roleName) {
            Role::findByName($roleName, $guard)?->givePermissionTo('staff.settings');
        }
    }
}
