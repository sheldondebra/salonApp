<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\RoleName;
use App\Enums\UserType;
use App\Http\Controllers\Api\V1\Concerns\ResolvesTenantFromRequest;
use App\Http\Controllers\Controller;
use App\Http\Resources\StaffMemberResource;
use App\Models\StaffMember;
use App\Models\User;
use App\Support\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class StaffMemberController extends Controller
{
    use ResolvesTenantFromRequest;

    public function index(Request $request, string $tenantSlug): JsonResponse
    {
        $this->authorize('viewAny', StaffMember::class);

        $query = StaffMember::query()->with('user')->orderBy('display_name');

        if ($search = $request->string('q')->trim()->toString()) {
            $query->where(function ($q) use ($search) {
                $q->where('display_name', 'like', "%{$search}%")
                    ->orWhere('title', 'like', "%{$search}%")
                    ->orWhereHas('user', fn ($u) => $u->where('email', 'like', "%{$search}%"));
            });
        }

        if ($request->filled('is_active')) {
            $query->whereBool('is_active', $request->boolean('is_active'));
        }

        $paginated = $query->paginate(min($request->integer('per_page', 20), 50));

        return StaffMemberResource::collection($paginated)->response();
    }

    public function store(Request $request, string $tenantSlug): JsonResponse
    {
        $this->authorize('create', StaffMember::class);

        $tenant = $this->tenant($request, $tenantSlug);

        $validated = $request->validate([
            'display_name' => ['required', 'string', 'max:255'],
            'title' => ['nullable', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:40'],
            'is_bookable' => ['sometimes', 'boolean'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $user = null;
        if (! empty($validated['email'])) {
            $user = User::query()->firstOrCreate(
                ['email' => strtolower($validated['email'])],
                [
                    'name' => $validated['display_name'],
                    'phone' => $validated['phone'] ?? null,
                    'password' => Hash::make(Str::random(32)),
                    'user_type' => UserType::Staff,
                    'is_active' => true,
                ]
            );
            if (! $user->tenants()->where('tenants.id', $tenant->id)->exists()) {
                $user->tenants()->attach($tenant->id, ['joined_at' => now()]);
            }
            $this->assignTenantRole($user, RoleName::Staff->value);
        } else {
            $user = User::query()->create([
                'name' => $validated['display_name'],
                'email' => 'staff+'.Str::uuid().'@tenant.local',
                'password' => Hash::make(Str::random(32)),
                'user_type' => UserType::Staff,
                'phone' => $validated['phone'] ?? null,
                'is_active' => true,
            ]);
            $user->tenants()->attach($tenant->id, ['joined_at' => now()]);
            $this->assignTenantRole($user, RoleName::Staff->value);
        }

        $staff = StaffMember::query()->create([
            'user_id' => $user->id,
            'display_name' => $validated['display_name'],
            'title' => $validated['title'] ?? null,
            'is_bookable' => $validated['is_bookable'] ?? true,
            'is_active' => $validated['is_active'] ?? true,
        ]);

        return (new StaffMemberResource($staff->load('user')))
            ->response()
            ->setStatusCode(201);
    }

    public function update(Request $request, string $tenantSlug, StaffMember $staffMember): JsonResponse
    {
        $this->authorize('update', $staffMember);

        $validated = $request->validate([
            'display_name' => ['sometimes', 'string', 'max:255'],
            'title' => ['nullable', 'string', 'max:255'],
            'is_bookable' => ['sometimes', 'boolean'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $staffMember->update($validated);

        return (new StaffMemberResource($staffMember->fresh('user')))->response();
    }

    public function destroy(Request $request, string $tenantSlug, StaffMember $staffMember): JsonResponse
    {
        $this->authorize('delete', $staffMember);

        $staffMember->update(['is_active' => false, 'is_bookable' => false]);

        return response()->json(['message' => 'Staff member deactivated.']);
    }

    protected function assignTenantRole(User $user, string $roleName): void
    {
        $registrar = app(PermissionRegistrar::class);
        $registrar->setPermissionsTeamId(TenantContext::id());
        $role = Role::findByName($roleName, config('permissions.guard', 'sanctum'));
        $user->syncRoles([$role]);
    }
}
