<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\RoleName;
use App\Enums\UserType;
use App\Http\Controllers\Api\V1\Concerns\ResolvesTenantFromRequest;
use App\Http\Controllers\Controller;
use App\Http\Resources\StaffMemberResource;
use App\Models\Appointment;
use App\Models\StaffMember;
use App\Models\User;
use App\Services\StaffServiceAssignmentService;
use App\Support\TenantContext;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\Rule;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class StaffMemberController extends Controller
{
    use ResolvesTenantFromRequest;

    public function __construct(
        protected StaffServiceAssignmentService $staffAssignments,
    ) {}

    public function stats(Request $request, string $tenantSlug): JsonResponse
    {
        $this->authorize('viewAny', StaffMember::class);

        $tenantId = TenantContext::id();
        $now = now();

        $base = StaffMember::query();

        $busyIds = Appointment::withoutGlobalScope('tenant')
            ->where('tenant_id', $tenantId)
            ->whereNotNull('staff_member_id')
            ->where('starts_at', '<=', $now)
            ->where('ends_at', '>', $now)
            ->whereIn('status', ['pending', 'confirmed'])
            ->pluck('staff_member_id');

        $hasEmploymentStatus = Schema::hasColumn('staff_members', 'employment_status');

        $onLeaveToday = 0;
        $availableNowQuery = (clone $base)
            ->whereBool('is_active', true)
            ->whereBool('is_bookable', true)
            ->whereNotIn('id', $busyIds);

        if ($hasEmploymentStatus) {
            $onLeaveToday = (clone $base)
                ->where('employment_status', StaffMember::STATUS_ON_LEAVE)
                ->count();
            $availableNowQuery->where('employment_status', StaffMember::STATUS_ACTIVE);
        }

        return response()->json([
            'stats' => [
                'total' => (clone $base)->count(),
                'active' => (clone $base)->whereBool('is_active', true)->count(),
                'bookable' => (clone $base)->whereBool('is_active', true)->whereBool('is_bookable', true)->count(),
                'on_leave_today' => $onLeaveToday,
                'available_now' => $availableNowQuery->count(),
            ],
        ]);
    }

    public function index(Request $request, string $tenantSlug): JsonResponse
    {
        $this->authorize('viewAny', StaffMember::class);

        $query = StaffMember::query()
            ->with(['user', 'location'])
            ->withCount('appointments')
            ->orderBy('display_name');

        if ($search = $request->string('q')->trim()->toString()) {
            $query->where(function ($q) use ($search) {
                $q->where('display_name', 'like', "%{$search}%")
                    ->orWhere('title', 'like', "%{$search}%")
                    ->orWhereHas('user', fn ($u) => $u->where('email', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%"));
            });
        }

        if ($request->filled('is_active')) {
            $query->whereBool('is_active', $request->boolean('is_active'));
        }

        if ($request->filled('is_bookable')) {
            $query->whereBool('is_bookable', $request->boolean('is_bookable'));
        }

        if ($request->filled('location_id')) {
            $query->where('location_id', $request->integer('location_id'));
        }

        if ($request->filled('employment_status')) {
            $query->where('employment_status', $request->string('employment_status')->toString());
        }

        if ($title = $request->string('title')->trim()->toString()) {
            $query->where('title', 'like', "%{$title}%");
        }

        if ($request->filled('service_id')) {
            $this->staffAssignments->applyBookableForServices($query, [(int) $request->integer('service_id')]);
        }

        $serviceIds = $request->input('service_ids', []);
        if (is_array($serviceIds) && $serviceIds !== []) {
            $this->staffAssignments->applyBookableForServices(
                $query,
                array_values(array_map('intval', array_filter($serviceIds))),
            );
        }

        $paginated = $query->paginate(min($request->integer('per_page', 20), 100));

        return StaffMemberResource::collection($paginated)->response();
    }

    public function show(Request $request, string $tenantSlug, StaffMember $staffMember): JsonResponse
    {
        $this->authorize('view', $staffMember);

        $staffMember->load(['user', 'location'])->loadCount('appointments');

        return response()->json(['data' => new StaffMemberResource($staffMember)]);
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
            'location_id' => ['nullable', 'integer', Rule::exists('locations', 'id')->where('tenant_id', $tenant->id)],
            'bio' => ['nullable', 'string', 'max:5000'],
            'avatar_url' => ['nullable', 'string', 'max:2048'],
            'initials' => ['nullable', 'string', 'max:8'],
            'is_bookable' => ['sometimes', 'boolean'],
            'is_active' => ['sometimes', 'boolean'],
            'employment_status' => ['sometimes', 'string', Rule::in([
                StaffMember::STATUS_ACTIVE,
                StaffMember::STATUS_ON_LEAVE,
                StaffMember::STATUS_INACTIVE,
                StaffMember::STATUS_TERMINATED,
            ])],
            'employment_type' => ['nullable', 'string', Rule::in(['full_time', 'part_time', 'contractor'])],
            'hire_date' => ['nullable', 'date'],
            'color_code' => ['nullable', 'string', 'max:16'],
        ]);

        $user = $this->resolveStaffUser($tenant, $validated);

        $staff = StaffMember::query()->create([
            'user_id' => $user->id,
            'location_id' => $validated['location_id'] ?? null,
            'display_name' => $validated['display_name'],
            'initials' => $validated['initials'] ?? StaffMember::makeInitials($validated['display_name']),
            'title' => $validated['title'] ?? null,
            'bio' => $validated['bio'] ?? null,
            'avatar_url' => $validated['avatar_url'] ?? null,
            'is_bookable' => $validated['is_bookable'] ?? true,
            'is_active' => $validated['is_active'] ?? true,
            'employment_status' => $validated['employment_status'] ?? StaffMember::STATUS_ACTIVE,
            'employment_type' => $validated['employment_type'] ?? null,
            'hire_date' => $validated['hire_date'] ?? null,
            'color_code' => $validated['color_code'] ?? null,
        ]);

        return (new StaffMemberResource($staff->load(['user', 'location'])->loadCount('appointments')))
            ->response()
            ->setStatusCode(201);
    }

    public function update(Request $request, string $tenantSlug, StaffMember $staffMember): JsonResponse
    {
        $this->authorize('update', $staffMember);

        $tenant = $this->tenant($request, $tenantSlug);

        $validated = $request->validate([
            'display_name' => ['sometimes', 'string', 'max:255'],
            'title' => ['nullable', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:40'],
            'location_id' => ['nullable', 'integer', Rule::exists('locations', 'id')->where('tenant_id', $tenant->id)],
            'bio' => ['nullable', 'string', 'max:5000'],
            'avatar_url' => ['nullable', 'string', 'max:2048'],
            'initials' => ['nullable', 'string', 'max:8'],
            'is_bookable' => ['sometimes', 'boolean'],
            'is_active' => ['sometimes', 'boolean'],
            'employment_status' => ['sometimes', 'string', Rule::in([
                StaffMember::STATUS_ACTIVE,
                StaffMember::STATUS_ON_LEAVE,
                StaffMember::STATUS_INACTIVE,
                StaffMember::STATUS_TERMINATED,
            ])],
            'employment_type' => ['nullable', 'string', Rule::in(['full_time', 'part_time', 'contractor'])],
            'hire_date' => ['nullable', 'date'],
            'color_code' => ['nullable', 'string', 'max:16'],
        ]);

        $staffFields = collect($validated)->except(['email', 'phone'])->all();
        if (isset($staffFields['display_name']) && empty($staffFields['initials'])) {
            $staffFields['initials'] = StaffMember::makeInitials($staffFields['display_name']);
        }
        $staffMember->update($staffFields);

        if ($staffMember->user && (array_key_exists('email', $validated) || array_key_exists('phone', $validated))) {
            $staffMember->user->update(array_filter([
                'email' => $validated['email'] ?? $staffMember->user->email,
                'phone' => array_key_exists('phone', $validated) ? $validated['phone'] : $staffMember->user->phone,
                'name' => $staffFields['display_name'] ?? $staffMember->user->name,
            ], fn ($v) => $v !== null));
        }

        return (new StaffMemberResource($staffMember->fresh(['user', 'location'])->loadCount('appointments')))->response();
    }

    public function destroy(Request $request, string $tenantSlug, StaffMember $staffMember): JsonResponse
    {
        $this->authorize('delete', $staffMember);

        $staffMember->update([
            'is_active' => false,
            'is_bookable' => false,
            'employment_status' => StaffMember::STATUS_INACTIVE,
        ]);

        return response()->json(['message' => 'Staff member deactivated.']);
    }

    protected function resolveStaffUser($tenant, array $validated): User
    {
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

            return $user;
        }

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

        return $user;
    }

    protected function assignTenantRole(User $user, string $roleName): void
    {
        $registrar = app(PermissionRegistrar::class);
        $registrar->setPermissionsTeamId(TenantContext::id());
        $role = Role::findByName($roleName, config('permissions.guard', 'sanctum'));
        $user->syncRoles([$role]);
    }
}
