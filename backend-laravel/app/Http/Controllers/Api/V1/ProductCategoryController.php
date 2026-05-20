<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductCategoryResource;
use App\Models\ProductCategory;
use App\Support\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductCategoryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', ProductCategory::class);

        $query = ProductCategory::query()->orderBy('sort_order')->orderBy('name');

        if ($request->filled('is_active')) {
            $query->whereBool('is_active', $request->boolean('is_active'));
        }

        if ($search = $request->string('q')->trim()->toString()) {
            $query->where('name', 'like', "%{$search}%");
        }

        $paginated = $query->paginate(min($request->integer('per_page', 20), 50));

        return ProductCategoryResource::collection($paginated)->response();
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorize('create', ProductCategory::class);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $category = ProductCategory::query()->create($validated);

        return (new ProductCategoryResource($category))
            ->response()
            ->setStatusCode(201);
    }

    public function update(Request $request, ProductCategory $productCategory): JsonResponse
    {
        $this->ensureTenant($productCategory);
        $this->authorize('update', $productCategory);

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $productCategory->update($validated);

        return (new ProductCategoryResource($productCategory->fresh()))->response();
    }

    public function destroy(ProductCategory $productCategory): JsonResponse
    {
        $this->ensureTenant($productCategory);
        $this->authorize('delete', $productCategory);

        $productCategory->update(['is_active' => false]);

        return response()->json(['message' => 'Category deactivated.']);
    }

    protected function ensureTenant(ProductCategory $productCategory): void
    {
        if ($productCategory->tenant_id !== TenantContext::id()) {
            abort(404);
        }
    }
}
