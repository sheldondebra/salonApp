<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\RoleName;
use App\Enums\UserType;
use App\Http\Controllers\Api\V1\Concerns\ResolvesTenantFromRequest;
use App\Http\Controllers\Controller;
use App\Http\Resources\ClientResource;
use App\Models\Appointment;
use App\Models\User;
use App\Support\PermissionChecker;
use App\Support\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class ClientController extends Controller
{
    use ResolvesTenantFromRequest;

    public function index(Request $request, string $tenantSlug): JsonResponse
    {
        $this->requirePermission($request, 'clients.view');

        $tenant = $this->tenant($request, $tenantSlug);

        $query = User::query()
            ->where('user_type', UserType::Client)
            ->whereHas('tenants', fn ($q) => $q->where('tenants.id', $tenant->id))
            ->with(['tenants' => fn ($q) => $q->where('tenants.id', $tenant->id)])
            ->withCount([
                'clientAppointments as appointments_count' => function ($q) use ($tenant) {
                    $q->withoutGlobalScope('tenant')
                        ->where('tenant_id', $tenant->id);
                },
            ])
            ->orderBy('name');

        if ($search = $request->string('q')->trim()->toString()) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        if ($request->filled('is_active')) {
            $query->whereBool('is_active', $request->boolean('is_active'));
        }

        $paginated = $query->paginate(min($request->integer('per_page', 20), 50));

        return ClientResource::collection($paginated)->response();
    }

    public function store(Request $request, string $tenantSlug): JsonResponse
    {
        $this->requirePermission($request, 'clients.create');

        $tenant = $this->tenant($request, $tenantSlug);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:40'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $email = strtolower($validated['email']);

        $user = User::query()->where('email', $email)->first();

        if ($user && $user->tenants()->where('tenants.id', $tenant->id)->exists()) {
            return response()->json(['message' => 'This client is already in your directory.'], 422);
        }

        if (! $user) {
            $user = User::query()->create([
                'name' => $validated['name'],
                'email' => $email,
                'phone' => $validated['phone'] ?? null,
                'password' => Hash::make(Str::random(32)),
                'user_type' => UserType::Client,
                'is_active' => $validated['is_active'] ?? true,
            ]);
        } else {
            $user->update([
                'name' => $validated['name'],
                'phone' => $validated['phone'] ?? $user->phone,
                'user_type' => UserType::Client,
                'is_active' => $validated['is_active'] ?? $user->is_active,
            ]);
        }

        $user->tenants()->syncWithoutDetaching([
            $tenant->id => ['joined_at' => now()],
        ]);

        $this->assignTenantRole($user, RoleName::Client->value);

        return (new ClientResource($user->load(['tenants' => fn ($q) => $q->where('tenants.id', $tenant->id)])))
            ->response()
            ->setStatusCode(201);
    }

    public function update(Request $request, string $tenantSlug, User $client): JsonResponse
    {
        $this->requirePermission($request, 'clients.update');

        $tenant = $this->tenant($request, $tenantSlug);
        abort_unless(
            $client->user_type === UserType::Client
            && $client->tenants()->where('tenants.id', $tenant->id)->exists(),
            404
        );

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'email', 'max:255', Rule::unique('users', 'email')->ignore($client->id)],
            'phone' => ['nullable', 'string', 'max:40'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $client->update($validated);

        return (new ClientResource($client->fresh()))->response();
    }

    public function destroy(Request $request, string $tenantSlug, User $client): JsonResponse
    {
        $this->requirePermission($request, 'clients.delete');

        $tenant = $this->tenant($request, $tenantSlug);
        abort_unless($client->tenants()->where('tenants.id', $tenant->id)->exists(), 404);

        $client->tenants()->detach($tenant->id);
        $client->update(['is_active' => false]);

        return response()->json(['message' => 'Client removed from workspace.']);
    }

    protected function assignTenantRole(User $user, string $roleName): void
    {
        $registrar = app(PermissionRegistrar::class);
        $registrar->setPermissionsTeamId(TenantContext::id());
        $role = Role::findByName($roleName, config('permissions.guard', 'sanctum'));
        $user->syncRoles([$role]);
    }

    protected function requirePermission(Request $request, string $permission): void
    {
        abort_unless(PermissionChecker::allows($request->user(), $permission), 403);
    }
}
