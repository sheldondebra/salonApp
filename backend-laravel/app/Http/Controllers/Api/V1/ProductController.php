<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\StockMovementType;
use App\Http\Controllers\Controller;
use App\Http\Resources\ProductResource;
use App\Http\Resources\StockMovementResource;
use App\Models\Product;
use App\Services\InventoryService;
use App\Support\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use InvalidArgumentException;

class ProductController extends Controller
{
    public function __construct(
        protected InventoryService $inventory,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Product::class);

        $query = Product::query()
            ->with(['category', 'supplier', 'stocks.location'])
            ->orderBy('name');

        if ($search = $request->string('q')->trim()->toString()) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('sku', 'like', "%{$search}%")
                    ->orWhere('barcode', 'like', "%{$search}%");
            });
        }

        if ($request->filled('is_active')) {
            $query->whereBool('is_active', $request->boolean('is_active'));
        }

        if ($request->filled('product_category_id')) {
            $query->where('product_category_id', $request->integer('product_category_id'));
        }

        if ($request->filled('supplier_id')) {
            $query->where('supplier_id', $request->integer('supplier_id'));
        }

        $locationId = $request->filled('location_id') ? $request->integer('location_id') : null;

        if ($request->boolean('low_stock')) {
            $products = $query->get();
            $filtered = $products->filter(function (Product $product) use ($locationId) {
                return $this->inventory->productQuantity($product, $locationId) <= $product->low_stock_threshold;
            })->values();

            return ProductResource::collection($filtered)->response();
        }

        $paginated = $query->paginate(min($request->integer('per_page', 20), 50));

        return ProductResource::collection($paginated)->response();
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorize('create', Product::class);

        $tenantId = TenantContext::id();

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'product_category_id' => ['nullable', 'integer', Rule::exists('product_categories', 'id')->where('tenant_id', $tenantId)],
            'supplier_id' => ['nullable', 'integer', Rule::exists('suppliers', 'id')->where('tenant_id', $tenantId)],
            'sku' => ['nullable', 'string', 'max:80', Rule::unique('products', 'sku')->where('tenant_id', $tenantId)],
            'barcode' => ['nullable', 'string', 'max:80'],
            'description' => ['nullable', 'string', 'max:5000'],
            'image_url' => ['nullable', 'string', 'max:2048'],
            'cost_cents' => ['required', 'integer', 'min:0'],
            'retail_cents' => ['required', 'integer', 'min:0'],
            'low_stock_threshold' => ['sometimes', 'integer', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
            'initial_stock' => ['nullable', 'array'],
            'initial_stock.*.location_id' => ['required', 'integer', Rule::exists('locations', 'id')->where('tenant_id', $tenantId)],
            'initial_stock.*.quantity' => ['required', 'integer', 'min:0'],
        ]);

        $initialStock = $validated['initial_stock'] ?? [];
        unset($validated['initial_stock']);

        $product = Product::query()->create($validated);

        foreach ($initialStock as $row) {
            if ((int) $row['quantity'] > 0) {
                $this->inventory->adjustStock(
                    $product,
                    (int) $row['location_id'],
                    (int) $row['quantity'],
                    StockMovementType::Initial,
                    'initial_stock',
                    null,
                    $request->user(),
                );
            }
        }

        return (new ProductResource($product->load(['category', 'supplier', 'stocks.location'])))
            ->response()
            ->setStatusCode(201);
    }

    public function update(Request $request, Product $product): JsonResponse
    {
        $this->ensureTenant($product);
        $this->authorize('update', $product);

        $tenantId = TenantContext::id();

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'product_category_id' => ['nullable', 'integer', Rule::exists('product_categories', 'id')->where('tenant_id', $tenantId)],
            'supplier_id' => ['nullable', 'integer', Rule::exists('suppliers', 'id')->where('tenant_id', $tenantId)],
            'sku' => ['nullable', 'string', 'max:80', Rule::unique('products', 'sku')->where('tenant_id', $tenantId)->ignore($product->id)],
            'barcode' => ['nullable', 'string', 'max:80'],
            'description' => ['nullable', 'string', 'max:5000'],
            'image_url' => ['nullable', 'string', 'max:2048'],
            'cost_cents' => ['sometimes', 'integer', 'min:0'],
            'retail_cents' => ['sometimes', 'integer', 'min:0'],
            'low_stock_threshold' => ['sometimes', 'integer', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $product->update($validated);

        return (new ProductResource($product->fresh(['category', 'supplier', 'stocks.location'])))->response();
    }

    public function destroy(Product $product): JsonResponse
    {
        $this->ensureTenant($product);
        $this->authorize('delete', $product);

        $product->update(['is_active' => false]);

        return response()->json(['message' => 'Product deactivated.']);
    }

    public function adjustStock(Request $request, Product $product): JsonResponse
    {
        $this->ensureTenant($product);
        $this->authorize('update', $product);

        $tenantId = TenantContext::id();

        $validated = $request->validate([
            'location_id' => ['required', 'integer', Rule::exists('locations', 'id')->where('tenant_id', $tenantId)],
            'mode' => ['required', Rule::in(['delta', 'set'])],
            'quantity' => ['required', 'integer'],
            'type' => ['sometimes', Rule::in(array_column(StockMovementType::cases(), 'value'))],
            'reason' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $type = StockMovementType::from($validated['type'] ?? StockMovementType::Adjustment->value);
        $setAbsolute = $validated['mode'] === 'set';
        $quantity = (int) $validated['quantity'];
        $change = $setAbsolute ? $quantity : $quantity;

        try {
            $movement = $this->inventory->adjustStock(
                $product,
                (int) $validated['location_id'],
                $change,
                $type,
                $validated['reason'] ?? null,
                $validated['notes'] ?? null,
                $request->user(),
                $setAbsolute,
            );
        } catch (InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json([
            'data' => new StockMovementResource($movement->load(['product', 'location', 'user'])),
            'product' => new ProductResource($product->fresh(['category', 'supplier', 'stocks.location'])),
        ]);
    }

    protected function ensureTenant(Product $product): void
    {
        if ($product->tenant_id !== TenantContext::id()) {
            abort(404);
        }
    }
}
