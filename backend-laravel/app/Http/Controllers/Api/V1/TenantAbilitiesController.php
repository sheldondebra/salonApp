<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\RoleName;
use App\Http\Controllers\Controller;
use App\Support\PermissionList;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

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

        return response()->json([
            'roles' => $user->getRoleNames()->values(),
            'permissions' => $user->getAllPermissions()->pluck('name')->values(),
        ]);
    }
}
