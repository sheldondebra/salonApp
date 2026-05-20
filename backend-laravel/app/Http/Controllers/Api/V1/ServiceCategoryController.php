<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\V1\Concerns\ResolvesTenantFromRequest;
use App\Http\Controllers\Controller;
use App\Http\Resources\ServiceCategoryResource;
use App\Models\ServiceCategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ServiceCategoryController extends Controller
{
    use ResolvesTenantFromRequest;

    public function index(Request $request, string $tenantSlug): JsonResponse
    {
        $this->authorize('viewAny', ServiceCategory::class);

        $query = ServiceCategory::query()
            ->withCount('services')
            ->orderBy('sort_order')
            ->orderBy('name');

        if ($search = $request->string('q')->trim()->toString()) {
            $query->where('name', 'like', "%{$search}%");
        }

        if ($request->filled('is_active')) {
            $query->whereBool('is_active', $request->boolean('is_active'));
        }

        $paginated = $query->paginate(min($request->integer('per_page', 50), 100));

        return ServiceCategoryResource::collection($paginated)->response();
    }

    public function store(Request $request, string $tenantSlug): JsonResponse
    {
        $this->authorize('create', ServiceCategory::class);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $category = ServiceCategory::query()->create($validated);

        return (new ServiceCategoryResource($category))
            ->response()
            ->setStatusCode(201);
    }

    public function update(Request $request, string $tenantSlug, ServiceCategory $serviceCategory): JsonResponse
    {
        $this->authorize('update', $serviceCategory);

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $serviceCategory->update($validated);

        return (new ServiceCategoryResource($serviceCategory->fresh()->loadCount('services')))->response();
    }

    public function destroy(Request $request, string $tenantSlug, ServiceCategory $serviceCategory): JsonResponse
    {
        $this->authorize('delete', $serviceCategory);

        $serviceCategory->delete();

        return response()->json(['message' => 'Category removed.']);
    }
}
