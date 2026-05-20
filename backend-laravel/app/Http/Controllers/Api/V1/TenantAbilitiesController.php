<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\RoleName;
use App\Http\Controllers\Controller;
use App\Support\PermissionList;
use App\Support\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Spatie\Permission\PermissionRegistrar;

class TenantAbilitiesController extends Controller
{
    /**
     * Permissions and roles for the current user in the resolved tenant context.
     */
    public function __invoke(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->isSuperAdmin()) {
            return response()->json([
                'roles' => [RoleName::SuperAdmin->value],
                'permissions' => PermissionList::all(),
            ]);
        }

        $tenantId = TenantContext::id();
        if ($tenantId) {
            app(PermissionRegistrar::class)->setPermissionsTeamId($tenantId);
        }

        return response()->json([
            'roles' => $user->getRoleNames()->values(),
            'permissions' => $user->getAllPermissions()->pluck('name')->values(),
        ]);
    }
}
