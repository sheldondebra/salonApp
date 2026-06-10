<?php

namespace App\Services;

use App\Enums\StockMovementType;
use App\Models\InventoryStock;
use App\Models\Product;
use App\Models\StockMovement;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class InventoryService
{
    public function allowNegativeStock(Tenant $tenant): bool
    {
        $settings = $tenant->inventorySettings();

        return (bool) ($settings['allow_negative_stock'] ?? false);
    }

    /**
     * @return array{
     *   total_products: int,
     *   active_products: int,
     *   low_stock_count: int,
     *   total_units: int,
     *   stock_value_cents: int,
     * }
     */
    public function dashboardSummary(int $tenantId, ?int $locationId = null): array
    {
        $products = Product::query()->where('tenant_id', $tenantId)->whereBool('is_active')->get(['id', 'cost_cents', 'low_stock_threshold']);

        $stockQuery = InventoryStock::query()->where('tenant_id', $tenantId);
        if ($locationId) {
            $stockQuery->where('location_id', $locationId);
        }

        $stocks = $stockQuery->get(['product_id', 'quantity']);
        $qtyByProduct = $stocks->groupBy('product_id')->map(fn ($rows) => $rows->sum('quantity'));

        $lowStock = 0;
        $totalUnits = 0;
        $valueCents = 0;

        foreach ($products as $product) {
            $qty = (int) ($qtyByProduct[$product->id] ?? 0);
            $totalUnits += $qty;
            $valueCents += $qty * (int) $product->cost_cents;
            if ($qty <= (int) $product->low_stock_threshold) {
                $lowStock++;
            }
        }

        return [
            'total_products' => Product::query()->where('tenant_id', $tenantId)->count(),
            'active_products' => $products->count(),
            'low_stock_count' => $lowStock,
            'total_units' => $totalUnits,
            'stock_value_cents' => $valueCents,
        ];
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function lowStockProducts(int $tenantId, ?int $locationId = null, int $limit = 10): array
    {
        $products = Product::query()
            ->where('tenant_id', $tenantId)
            ->whereBool('is_active')
            ->with(['category', 'stocks.location'])
            ->orderBy('name')
            ->get();

        $rows = [];

        foreach ($products as $product) {
            $qty = $this->productQuantity($product, $locationId);
            if ($qty > $product->low_stock_threshold) {
                continue;
            }

            $rows[] = [
                'id' => $product->id,
                'name' => $product->name,
                'sku' => $product->sku,
                'quantity' => $qty,
                'low_stock_threshold' => $product->low_stock_threshold,
                'category' => $product->category?->name,
            ];

            if (count($rows) >= $limit) {
                break;
            }
        }

        return $rows;
    }

    public function productQuantity(Product $product, ?int $locationId = null): int
    {
        $query = $product->stocks();
        if ($locationId) {
            $query->where('location_id', $locationId);
        }

        return (int) $query->sum('quantity');
    }

    public function adjustStock(
        Product $product,
        int $locationId,
        int $quantityChange,
        StockMovementType $type,
        ?string $reason = null,
        ?string $notes = null,
        ?User $user = null,
        bool $setAbsolute = false,
        ?int $saleId = null,
        ?int $purchaseOrderId = null,
    ): StockMovement {
        if ($quantityChange === 0 && ! $setAbsolute) {
            throw new InvalidArgumentException('Quantity change cannot be zero.');
        }

        $tenant = $product->tenant ?? Tenant::query()->findOrFail($product->tenant_id);
        $allowNegative = $this->allowNegativeStock($tenant);

        return DB::transaction(function () use ($product, $locationId, $quantityChange, $type, $reason, $notes, $user, $setAbsolute, $allowNegative, $saleId, $purchaseOrderId) {
            $stock = InventoryStock::query()->firstOrCreate(
                [
                    'product_id' => $product->id,
                    'location_id' => $locationId,
                ],
                [
                    'tenant_id' => $product->tenant_id,
                    'quantity' => 0,
                ]
            );

            $before = (int) $stock->quantity;
            $after = $setAbsolute ? $quantityChange : $before + $quantityChange;

            if (! $allowNegative && $after < 0) {
                throw new InvalidArgumentException('Insufficient stock. Enable negative stock in settings if needed.');
            }

            $delta = $after - $before;

            $stock->update(['quantity' => $after]);

            return StockMovement::query()->create([
                'tenant_id' => $product->tenant_id,
                'product_id' => $product->id,
                'location_id' => $locationId,
                'user_id' => $user?->id,
                'sale_id' => $saleId,
                'purchase_order_id' => $purchaseOrderId,
                'type' => $type,
                'quantity_change' => $delta,
                'quantity_before' => $before,
                'quantity_after' => $after,
                'reason' => $reason,
                'notes' => $notes,
            ]);
        });
    }
}
