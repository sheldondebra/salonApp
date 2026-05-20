<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\V1\Concerns\ResolvesTenantFromRequest;
use App\Http\Controllers\Controller;
use App\Http\Resources\ServiceResource;
use App\Models\Service;
use App\Support\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ServiceController extends Controller
{
    use ResolvesTenantFromRequest;

    public function index(Request $request, string $tenantSlug): JsonResponse
    {
        $this->authorize('viewAny', Service::class);

        $query = Service::query()->with('category')->orderBy('name');

        if ($search = $request->string('q')->trim()->toString()) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if ($request->filled('is_active')) {
            $query->whereBool('is_active', $request->boolean('is_active'));
        }

        if ($request->filled('service_category_id')) {
            $query->where('service_category_id', $request->integer('service_category_id'));
        }

        if ($request->boolean('all')) {
            return ServiceResource::collection($query->get())->response();
        }

        $paginated = $query->paginate(min($request->integer('per_page', 20), 50));

        return ServiceResource::collection($paginated)->response();
    }

    public function store(Request $request, string $tenantSlug): JsonResponse
    {
        $this->authorize('create', Service::class);

        $this->tenant($request, $tenantSlug);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'duration_minutes' => ['required', 'integer', 'min:5', 'max:480'],
            'price_cents' => ['required', 'integer', 'min:0'],
            'service_category_id' => ['nullable', 'integer', 'exists:service_categories,id'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $service = Service::query()->create($validated);

        return (new ServiceResource($service->load('category')))
            ->response()
            ->setStatusCode(201);
    }

    public function update(Request $request, string $tenantSlug, Service $service): JsonResponse
    {
        $this->tenant($request, $tenantSlug);
        abort_unless($service->tenant_id === TenantContext::id(), 404);

        $this->authorize('update', $service);

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'duration_minutes' => ['sometimes', 'integer', 'min:5', 'max:480'],
            'price_cents' => ['sometimes', 'integer', 'min:0'],
            'service_category_id' => ['nullable', 'integer', 'exists:service_categories,id'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $service->update($validated);

        return (new ServiceResource($service->fresh('category')))->response();
    }

    public function destroy(Request $request, string $tenantSlug, Service $service): JsonResponse
    {
        $this->tenant($request, $tenantSlug);
        abort_unless($service->tenant_id === TenantContext::id(), 404);

        $this->authorize('delete', $service);

        $service->update(['is_active' => false]);

        return response()->json(['message' => 'Service deactivated.']);
    }
}
