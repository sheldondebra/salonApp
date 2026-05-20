<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\TenantStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\TenantResource;
use App\Models\Tenant;
use App\Services\OnboardingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class TenantController extends Controller
{
    public function index(Request $request, OnboardingService $onboarding): JsonResponse
    {
        $this->authorize('viewAny', Tenant::class);

        $query = Tenant::query()
            ->withCount('users')
            ->with(['users' => fn ($q) => $q->whereRaw('"tenant_user"."is_owner" IS TRUE'), 'domains']);

        if ($search = $request->string('q')->trim()->toString()) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('slug', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status')->toString());
        }

        if ($request->filled('plan')) {
            $query->where('plan', $request->string('plan')->toString());
        }

        $tenants = $query->latest()->paginate(min($request->integer('per_page', 20), 50));

        $data = $tenants->getCollection()->map(function (Tenant $tenant) use ($onboarding) {
            $owner = $tenant->users->first();

            return array_merge(
                (new TenantResource($tenant))->resolve(),
                [
                    'users_count' => $tenant->users_count,
                    'onboarding' => $onboarding->progressForTenant($tenant),
                    'owner' => $owner ? [
                        'name' => $owner->name,
                        'email' => $owner->email,
                        'onboarding_status' => $owner->onboarding_status?->value,
                    ] : null,
                ]
            );
        });

        return response()->json([
            'data' => $data,
            'meta' => [
                'current_page' => $tenants->currentPage(),
                'last_page' => $tenants->lastPage(),
                'per_page' => $tenants->perPage(),
                'total' => $tenants->total(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorize('create', Tenant::class);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:80', 'alpha_dash', 'unique:tenants,slug'],
            'plan' => ['nullable', 'string', 'max:50'],
            'status' => ['nullable', Rule::enum(TenantStatus::class)],
            'currency' => ['nullable', 'string', 'size:3'],
            'timezone' => ['nullable', 'string', 'max:64'],
        ]);

        $slug = $validated['slug'] ?? Str::slug($validated['name']);
        $base = $slug;
        $i = 1;
        while (Tenant::query()->where('slug', $slug)->exists()) {
            $slug = $base.'-'.$i++;
        }

        $tenant = Tenant::query()->create([
            'name' => $validated['name'],
            'slug' => $slug,
            'plan' => $validated['plan'] ?? 'starter',
            'status' => $validated['status'] ?? TenantStatus::Active,
            'currency' => $validated['currency'] ?? config('billing.currency', 'USD'),
            'timezone' => $validated['timezone'] ?? 'UTC',
        ]);

        return (new TenantResource($tenant->load('domains')))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Tenant $tenant): JsonResponse
    {
        $this->authorize('view', $tenant);

        $tenant->load([
            'domains',
            'users' => fn ($q) => $q->whereRaw('"tenant_user"."is_owner" IS TRUE'),
        ]);

        return (new TenantResource($tenant))->response();
    }

    public function update(Request $request, Tenant $tenant): JsonResponse
    {
        $this->authorize('update', $tenant);

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'slug' => ['sometimes', 'string', 'max:80', 'alpha_dash', Rule::unique('tenants', 'slug')->ignore($tenant->id)],
            'plan' => ['sometimes', 'string', 'max:50'],
            'status' => ['sometimes', Rule::enum(TenantStatus::class)],
            'currency' => ['sometimes', 'string', 'size:3'],
            'timezone' => ['sometimes', 'string', 'max:64'],
        ]);

        $tenant->update($validated);

        return (new TenantResource($tenant->fresh('domains')))->response();
    }

    public function destroy(Tenant $tenant): JsonResponse
    {
        $this->authorize('delete', $tenant);

        $tenant->delete();

        return response()->json(['message' => 'Tenant archived.']);
    }
}
