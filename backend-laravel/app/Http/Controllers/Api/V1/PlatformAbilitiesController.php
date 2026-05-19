<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
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

        return response()->json([
            'roles' => $user->getRoleNames(),
            'permissions' => $user->getAllPermissions()->pluck('name')->values(),
        ]);
    }
}
