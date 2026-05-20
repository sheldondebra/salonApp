<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\RoleName;
use App\Http\Controllers\Controller;
use App\Models\User;
use App\Support\PermissionChecker;
use App\Support\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class TenantTeamRoleController extends Controller
{
    /**
     * Assign a tenant-scoped role to a workspace member.
     */
    public function update(Request $request, string $tenantSlug, User $user): JsonResponse
    {
        $actor = $request->user();
        abort_unless(
            PermissionChecker::allowsAny($actor, ['settings.manage', 'staff.update']),
            403,
            'You do not have permission to assign roles.'
        );

        $tenantId = TenantContext::id();
        abort_unless($user->tenants()->where('tenants.id', $tenantId)->exists(), 404);

        $validated = $request->validate([
            'role' => [
                'required',
                'string',
                Rule::in([
                    RoleName::TenantOwner->value,
                    RoleName::Manager->value,
                    RoleName::Staff->value,
                    RoleName::Client->value,
                ]),
            ],
        ]);

        $registrar = app(PermissionRegistrar::class);
        $registrar->setPermissionsTeamId($tenantId);

        $role = Role::findByName($validated['role'], config('permissions.guard', 'sanctum'));
        $user->syncRoles([$role]);

        return response()->json([
            'message' => 'Role updated.',
            'user_id' => $user->id,
            'role' => $role->name,
            'permissions' => $user->getAllPermissions()->pluck('name')->values(),
        ]);
    }
}
