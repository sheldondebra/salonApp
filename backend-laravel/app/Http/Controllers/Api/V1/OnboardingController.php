<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\OnboardingStatus;
use App\Enums\TenantStatus;
use App\Enums\UserType;
use App\Http\Controllers\Controller;
use App\Http\Resources\TenantResource;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class OnboardingController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        if ($user->onboarding_status !== OnboardingStatus::Paid) {
            return response()->json([
                'message' => 'Complete payment before setting up your salon.',
            ], 403);
        }

        $validated = $request->validate([
            'business_name' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'max:80', 'alpha_dash', 'unique:tenants,slug'],
            'timezone' => ['nullable', 'string', 'max:64'],
            'currency' => ['nullable', 'string', 'size:3'],
            'business_phone' => ['nullable', 'string', 'max:30'],
            'business_email' => ['nullable', 'email', 'max:255'],
            'tagline' => ['nullable', 'string', 'max:255'],
        ]);

        $plan = $user->selected_plan ?? 'starter';

        $tenant = Tenant::query()->create([
            'name' => $validated['business_name'],
            'slug' => Str::slug($validated['slug']),
            'status' => TenantStatus::Active,
            'plan' => $plan,
            'timezone' => $validated['timezone'] ?? 'UTC',
            'currency' => strtoupper($validated['currency'] ?? config('billing.currency', 'USD')),
            'business_phone' => $validated['business_phone'] ?? $user->phone,
            'business_email' => $validated['business_email'] ?? $user->email,
            'tagline' => $validated['tagline'] ?? null,
        ]);

        $user->tenants()->attach($tenant->id, ['is_owner' => true, 'joined_at' => now()]);

        $registrar = app(PermissionRegistrar::class);
        $platformTeamId = config('tenant.platform_team_id', 0);
        $registrar->setPermissionsTeamId($platformTeamId);
        $role = Role::findByName('tenant_owner', 'sanctum');
        $registrar->setPermissionsTeamId($tenant->id);
        $user->assignRole($role);

        $user->update([
            'onboarding_status' => OnboardingStatus::Onboarded,
            'user_type' => UserType::TenantOwner,
        ]);

        return response()->json([
            'tenant' => new TenantResource($tenant),
            'redirect' => '/'.$tenant->slug.'/dashboard',
            'message' => 'Salon workspace created',
        ], 201);
    }
}
