<?php

namespace App\Services;

use App\Models\ProductBundle;
use App\Models\ProductBundleItem;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class ProductBundleService
{
    public function paginate(int $tenantId, array $filters = [], int $perPage = 20): LengthAwarePaginator
    {
        $query = ProductBundle::query()
            ->where('tenant_id', $tenantId)
            ->with(['items.product'])
            ->latest();

        if (isset($filters['is_active'])) {
            $query->whereBool('is_active', (bool) $filters['is_active']);
        }

        if (! empty($filters['q'])) {
            $term = '%'.$filters['q'].'%';
            $query->where('name', 'like', $term);
        }

        return $query->paginate(min($perPage, 50));
    }

    public function create(int $tenantId, array $data): ProductBundle
    {
        return DB::transaction(function () use ($tenantId, $data) {
            $bundle = ProductBundle::query()->create([
                'tenant_id' => $tenantId,
                'name' => $data['name'],
                'description' => $data['description'] ?? null,
                'price_cents' => (int) $data['price_cents'],
                'is_active' => $data['is_active'] ?? true,
            ]);

            $this->syncItems($bundle, $data['items'] ?? []);

            return $bundle->fresh(['items.product']);
        });
    }

    public function update(ProductBundle $bundle, array $data): ProductBundle
    {
        return DB::transaction(function () use ($bundle, $data) {
            $bundle->update(array_filter([
                'name' => $data['name'] ?? null,
                'description' => array_key_exists('description', $data) ? $data['description'] : null,
                'price_cents' => array_key_exists('price_cents', $data) ? (int) $data['price_cents'] : null,
                'is_active' => $data['is_active'] ?? null,
            ], fn ($value) => $value !== null));

            if (array_key_exists('items', $data)) {
                $this->syncItems($bundle, $data['items'] ?? []);
            }

            return $bundle->fresh(['items.product']);
        });
    }

    public function delete(ProductBundle $bundle): void
    {
        $bundle->update(['is_active' => false]);
    }

    public function posFormat(ProductBundle $bundle): array
    {
        $bundle->loadMissing(['items.product']);

        return [
            'type' => 'bundle',
            'uuid' => $bundle->uuid,
            'name' => $bundle->name,
            'price_cents' => (int) $bundle->price_cents,
            'items' => $bundle->items->map(fn (ProductBundleItem $item) => [
                'product_id' => $item->product_id,
                'product_name' => $item->product?->name,
                'quantity' => (int) $item->quantity,
                'unit_price_cents' => (int) ($item->product?->retail_cents ?? 0),
            ])->values()->all(),
        ];
    }

    public function format(ProductBundle $bundle): array
    {
        $bundle->loadMissing(['items.product']);

        return [
            'uuid' => $bundle->uuid,
            'name' => $bundle->name,
            'description' => $bundle->description,
            'price_cents' => (int) $bundle->price_cents,
            'is_active' => (bool) $bundle->is_active,
            'items' => $bundle->items->map(fn (ProductBundleItem $item) => [
                'uuid' => $item->uuid,
                'product_id' => $item->product_id,
                'product_name' => $item->product?->name,
                'quantity' => (int) $item->quantity,
            ])->values()->all(),
            'pos' => $this->posFormat($bundle),
        ];
    }

    private function syncItems(ProductBundle $bundle, array $items): void
    {
        $bundle->items()->delete();

        foreach ($items as $item) {
            $bundle->items()->create([
                'product_id' => $item['product_id'],
                'quantity' => max(1, (int) ($item['quantity'] ?? 1)),
            ]);
        }
    }
}
