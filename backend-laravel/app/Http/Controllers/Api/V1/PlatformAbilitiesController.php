<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\RoleName;
use App\Enums\UserType;
use App\Http\Controllers\Controller;
use App\Support\PermissionList;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class PlatformAbilitiesController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $registrar = app(PermissionRegistrar::class);
        $platformTeamId = config('tenant.platform_team_id', 0);
        $registrar->setPermissionsTeamId($platformTeamId);

        $user = $request->user();

        if ($user->isSuperAdmin()) {
            return response()->json([
                'roles' => [RoleName::SuperAdmin->value],
                'permissions' => PermissionList::all(),
            ]);
        }

        if ($user->user_type === UserType::OfficeAdmin) {
            $this->ensureOfficeAdminRole($user, $registrar, $platformTeamId);

            $permissions = $user->getAllPermissions()->pluck('name')->values();
            if ($permissions->isEmpty()) {
                $roleConfig = config('permissions.roles.'.RoleName::OfficeAdmin->value, []);
                $permissions = collect(
                    PermissionList::forRole(is_array($roleConfig) ? $roleConfig : [])
                )->values();
            }

            return response()->json([
                'roles' => $user->getRoleNames()->isNotEmpty()
                    ? $user->getRoleNames()->values()
                    : [RoleName::OfficeAdmin->value],
                'permissions' => $permissions,
            ]);
        }

        return response()->json([
            'roles' => $user->getRoleNames()->values(),
            'permissions' => $user->getAllPermissions()->pluck('name')->values(),
        ]);
    }

    protected function ensureOfficeAdminRole(
        $user,
        PermissionRegistrar $registrar,
        int $platformTeamId
    ): void {
        $registrar->setPermissionsTeamId($platformTeamId);

        if ($user->hasRole(RoleName::OfficeAdmin->value)) {
            return;
        }

        $role = Role::findByName(RoleName::OfficeAdmin->value, config('permissions.guard', 'sanctum'));
        $user->assignRole($role);
    }
}
