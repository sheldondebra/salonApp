<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\V1\Concerns\ResolvesTenantFromRequest;
use App\Http\Controllers\Controller;
use App\Models\ProductBundle;
use App\Services\ProductBundleService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductBundleController extends Controller
{
    use ResolvesTenantFromRequest;

    public function __construct(
        private readonly ProductBundleService $bundles,
    ) {}

    public function index(Request $request, string $tenantSlug): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);
        $filters = $request->validate([
            'q' => ['nullable', 'string', 'max:100'],
            'is_active' => ['nullable', 'boolean'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        $paginator = $this->bundles->paginate($tenant->id, $filters, (int) ($filters['per_page'] ?? 20));

        return response()->json([
            'data' => collect($paginator->items())->map(fn (ProductBundle $bundle) => $this->bundles->format($bundle)),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }

    public function store(Request $request, string $tenantSlug): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'price_cents' => ['required', 'integer', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'integer', 'exists:products,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
        ]);

        $bundle = $this->bundles->create($tenant->id, $data);

        return response()->json(['data' => $this->bundles->format($bundle)], 201);
    }

    public function show(Request $request, string $tenantSlug, ProductBundle $productBundle): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);
        abort_unless($productBundle->tenant_id === $tenant->id, 404);

        return response()->json(['data' => $this->bundles->format($productBundle)]);
    }

    public function update(Request $request, string $tenantSlug, ProductBundle $productBundle): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);
        abort_unless($productBundle->tenant_id === $tenant->id, 404);

        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'price_cents' => ['sometimes', 'integer', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
            'items' => ['sometimes', 'array'],
            'items.*.product_id' => ['required_with:items', 'integer', 'exists:products,id'],
            'items.*.quantity' => ['required_with:items', 'integer', 'min:1'],
        ]);

        $bundle = $this->bundles->update($productBundle, $data);

        return response()->json(['data' => $this->bundles->format($bundle)]);
    }

    public function destroy(Request $request, string $tenantSlug, ProductBundle $productBundle): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);
        abort_unless($productBundle->tenant_id === $tenant->id, 404);

        $this->bundles->delete($productBundle);

        return response()->json(['message' => 'Product bundle archived.']);
    }

    public function pos(Request $request, string $tenantSlug, ProductBundle $productBundle): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);
        abort_unless($productBundle->tenant_id === $tenant->id, 404);

        return response()->json(['data' => $this->bundles->posFormat($productBundle)]);
    }
}
