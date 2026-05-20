<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Enums\OnboardingStatus;
use App\Enums\UserType;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Models\Tenant;
use App\Services\LoginLogService;
use App\Support\PermissionList;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(RegisterRequest $request): JsonResponse
    {
        $intent = $request->input('account_intent', 'client');
        $isSalonOwner = $intent === 'salon_owner';

        $user = User::query()->create([
            'name' => $request->validated('name'),
            'email' => $request->validated('email'),
            'password' => $request->validated('password'),
            'phone' => $request->validated('phone'),
            'user_type' => $isSalonOwner ? UserType::TenantOwner : UserType::Client,
            'account_intent' => $intent,
            'onboarding_status' => $isSalonOwner ? OnboardingStatus::PaymentPending : OnboardingStatus::Complete,
            'selected_plan' => $isSalonOwner ? $request->validated('plan') : null,
            'marketing_opt_in' => $request->boolean('marketing_opt_in'),
            'is_active' => true,
        ]);

        if (! $isSalonOwner) {
            $tenant = Tenant::query()->where('slug', 'luxe-bloom')->first();
            if ($tenant) {
                $user->tenants()->attach($tenant->id, ['joined_at' => now()]);
                $registrar = app(PermissionRegistrar::class);
                $platformTeamId = config('tenant.platform_team_id', 0);
                $registrar->setPermissionsTeamId($platformTeamId);
                $role = Role::findByName('client', 'sanctum');
                $registrar->setPermissionsTeamId($tenant->id);
                $user->assignRole($role);
            }
        }

        $token = $user->createToken('api')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => new UserResource($user),
            'next' => $isSalonOwner ? '/checkout'.($request->validated('plan') ? '?plan='.$request->validated('plan') : '') : null,
        ], 201);
    }

    /**
     * Issue a Sanctum personal access token (mobile / integrations).
     */
    public function token(LoginRequest $request): JsonResponse
    {
        return $this->login($request);
    }

    public function login(LoginRequest $request, LoginLogService $loginLogs): JsonResponse
    {
        $email = strtolower(trim($request->validated('email')));
        $user = User::query()->whereRaw('LOWER(email) = ?', [$email])->first();

        if (! $user || ! Hash::check($request->validated('password'), $user->password)) {
            $loginLogs->recordFailure($user, $request, 'invalid_credentials');
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        if ($user->trashed()) {
            $loginLogs->recordFailure($user, $request, 'account_deleted');
            throw ValidationException::withMessages([
                'email' => ['This account is no longer available.'],
            ]);
        }

        if ($user->is_blocked) {
            $loginLogs->recordFailure($user, $request, 'account_blocked');
            throw ValidationException::withMessages([
                'email' => ['This account has been blocked. Contact support.'],
            ]);
        }

        if (! $user->is_active) {
            $loginLogs->recordFailure($user, $request, 'account_inactive');
            throw ValidationException::withMessages([
                'email' => ['This account has been deactivated.'],
            ]);
        }

        $user->tokens()->where('name', 'api')->delete();
        $token = $user->createToken('api')->plainTextToken;
        $loginLogs->recordSuccess($user, $request);

        if (
            $user->account_intent === 'salon_owner'
            || in_array($user->user_type, [UserType::TenantOwner, UserType::Manager, UserType::Staff], true)
        ) {
            $user->load(['tenants' => fn ($q) => $q->whereRaw('"tenant_user"."is_owner" IS TRUE')]);
        }

        return response()->json([
            'token' => $token,
            'user' => new UserResource($user),
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user();
        $registrar = app(PermissionRegistrar::class);
        $registrar->setPermissionsTeamId(config('tenant.platform_team_id', 0));

        $user->load([
            'roles',
            'tenants' => fn ($q) => $q->whereRaw('"tenant_user"."is_owner" IS TRUE'),
        ]);

        $platformPermissions = $user->isSuperAdmin()
            ? PermissionList::all()
            : $user->getAllPermissions()->pluck('name')->values();

        return response()->json([
            'user' => new UserResource($user),
            'tenants' => $user->tenants->map(fn ($tenant) => [
                'id' => $tenant->id,
                'name' => $tenant->name,
                'slug' => $tenant->slug,
                'is_owner' => (bool) $tenant->pivot->is_owner,
            ]),
            'platform_roles' => $user->getRoleNames()->values(),
            'platform_permissions' => $platformPermissions,
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()?->currentAccessToken()?->delete();

        return response()->json(['message' => 'Logged out']);
    }
}
