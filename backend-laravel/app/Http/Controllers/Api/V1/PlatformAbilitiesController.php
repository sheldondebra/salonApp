<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\RoleName;
use App\Http\Controllers\Controller;
use App\Support\PermissionList;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Spatie\Permission\PermissionRegistrar;

class PlatformAbilitiesController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        app(PermissionRegistrar::class)->setPermissionsTeamId(
            config('tenant.platform_team_id', 0)
        );

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
