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

    public function login(LoginRequest $request): JsonResponse
    {
        $email = strtolower(trim($request->validated('email')));
        $user = User::query()->whereRaw('LOWER(email) = ?', [$email])->first();

        if (! $user || ! Hash::check($request->validated('password'), $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        if (! $user->is_active) {
            throw ValidationException::withMessages([
                'email' => ['This account has been deactivated.'],
            ]);
        }

        $user->tokens()->where('name', 'api')->delete();
        $token = $user->createToken('api')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => new UserResource($user),
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user();
        $user->load(['roles', 'tenants']);

        return response()->json([
            'user' => new UserResource($user),
            'tenants' => $user->tenants->map(fn ($tenant) => [
                'id' => $tenant->id,
                'name' => $tenant->name,
                'slug' => $tenant->slug,
                'is_owner' => (bool) $tenant->pivot->is_owner,
            ]),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()?->currentAccessToken()?->delete();

        return response()->json(['message' => 'Logged out']);
    }
}
