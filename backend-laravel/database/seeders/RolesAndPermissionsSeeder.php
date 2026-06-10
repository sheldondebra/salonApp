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

        $paymentRequestRoles = [
            RoleName::TenantOwner->value => [
                'payment_requests.view',
                'payment_requests.create',
                'payment_requests.cancel',
                'payment_requests.retry',
                'payment_requests.verify',
            ],
            RoleName::Manager->value => [
                'payment_requests.view',
                'payment_requests.create',
                'payment_requests.cancel',
                'payment_requests.retry',
                'payment_requests.verify',
            ],
            RoleName::Staff->value => [
                'payment_requests.view',
                'payment_requests.create',
            ],
        ];

        foreach ($paymentRequestRoles as $roleName => $permissions) {
            Role::findByName($roleName, $guard)?->givePermissionTo($permissions);
        }

        $walletRoles = [
            RoleName::TenantOwner->value => ['wallet.view', 'wallet.export'],
            RoleName::Manager->value => ['wallet.view', 'wallet.export'],
            RoleName::Staff->value => ['wallet.view'],
        ];

        foreach ($walletRoles as $roleName => $permissions) {
            Role::findByName($roleName, $guard)?->givePermissionTo($permissions);
        }

        $financeOpsRoles = [
            RoleName::TenantOwner->value => [
                'finance.refund',
                'finance.adjust_transaction',
                'finance.apply_discount',
                'finance.approve_discount',
                'finance.view_tips',
                'finance.payroll.view',
                'finance.reconciliation.manage',
                'finance.taxes.manage',
            ],
            RoleName::Manager->value => [
                'finance.refund',
                'finance.adjust_transaction',
                'finance.apply_discount',
                'finance.approve_discount',
                'finance.view_tips',
                'finance.payroll.view',
                'finance.reconciliation.manage',
                'finance.taxes.manage',
            ],
            RoleName::Staff->value => [
                'finance.apply_discount',
                'finance.view_tips',
                'finance.payroll.view_self',
                'finance.reconciliation.manage',
                'approvals.create',
            ],
        ];

        foreach ($financeOpsRoles as $roleName => $permissions) {
            Role::findByName($roleName, $guard)?->givePermissionTo($permissions);
        }

        $officePermissions = [
            'office.dashboard.view',
            'office.tenants.view',
            'office.operations.view',
            'office.finance.view',
            'office.support.view',
            'office.settings.manage',
        ];

        Role::findByName(RoleName::OfficeAdmin->value, $guard)?->givePermissionTo($officePermissions);
    }
}
