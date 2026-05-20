<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\TenantDomainType;
use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Models\TenantDomain;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class DomainAdminController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = TenantDomain::query()
            ->with('tenant:id,uuid,name,slug')
            ->orderByDesc('created_at');

        if ($search = $request->string('q')->trim()->toString()) {
            $query->where(function ($q) use ($search) {
                $q->where('domain', 'like', "%{$search}%")
                    ->orWhereHas('tenant', fn ($t) => $t->where('name', 'like', "%{$search}%")->orWhere('slug', 'like', "%{$search}%"));
            });
        }

        if ($request->filled('verified')) {
            $request->boolean('verified')
                ? $query->whereNotNull('verified_at')
                : $query->whereNull('verified_at');
        }

        return response()->json($query->paginate(min($request->integer('per_page', 20), 50)));
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'tenant_id' => ['required', 'exists:tenants,id'],
            'domain' => ['required', 'string', 'max:255', 'unique:tenant_domains,domain'],
            'type' => ['required', Rule::enum(TenantDomainType::class)],
            'is_primary' => ['sometimes', 'boolean'],
        ]);

        if (! empty($validated['is_primary'])) {
            TenantDomain::query()
                ->where('tenant_id', $validated['tenant_id'])
                ->update(['is_primary' => false]);
        }

        $domain = TenantDomain::query()->create($validated);

        return response()->json(['data' => $domain->load('tenant:id,name,slug')], 201);
    }

    public function update(Request $request, TenantDomain $domain): JsonResponse
    {
        $validated = $request->validate([
            'domain' => ['sometimes', 'string', 'max:255', Rule::unique('tenant_domains', 'domain')->ignore($domain->id)],
            'is_primary' => ['sometimes', 'boolean'],
            'verified_at' => ['nullable', 'date'],
        ]);

        if (! empty($validated['is_primary'])) {
            TenantDomain::query()
                ->where('tenant_id', $domain->tenant_id)
                ->where('id', '!=', $domain->id)
                ->update(['is_primary' => false]);
        }

        $domain->update($validated);

        return response()->json(['data' => $domain->fresh('tenant:id,name,slug')]);
    }

    public function destroy(TenantDomain $domain): JsonResponse
    {
        $domain->delete();

        return response()->json(['message' => 'Domain removed.']);
    }
}
