<?php

namespace App\Services;

use App\Enums\StoreOrderStatus;
use App\Models\Product;
use App\Models\StoreOrder;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Validation\ValidationException;

class StoreOrderService
{
    public function publicCatalog(int $tenantId, array $filters = [], int $perPage = 20): LengthAwarePaginator
    {
        $query = Product::query()
            ->where('tenant_id', $tenantId)
            ->whereBool('is_active')
            ->whereBool('is_store_visible')
            ->with('category:id,name')
            ->orderBy('name');

        if (! empty($filters['q'])) {
            $term = '%'.$filters['q'].'%';
            $query->where(fn ($q) => $q->where('name', 'like', $term)->orWhere('store_description', 'like', $term));
        }

        return $query->paginate(min($perPage, 50));
    }

    public function checkout(int $tenantId, array $data): StoreOrder
    {
        $items = [];
        $subtotal = 0;

        foreach ($data['items'] as $item) {
            $product = Product::query()
                ->where('tenant_id', $tenantId)
                ->whereBool('is_active')
                ->whereBool('is_store_visible')
                ->findOrFail($item['product_id']);

            $qty = max(1, (int) $item['quantity']);
            $lineTotal = $qty * (int) $product->retail_cents;
            $subtotal += $lineTotal;

            $items[] = [
                'product_id' => $product->id,
                'product_name' => $product->name,
                'quantity' => $qty,
                'unit_price_cents' => (int) $product->retail_cents,
                'line_total_cents' => $lineTotal,
            ];
        }

        if ($items === []) {
            throw ValidationException::withMessages(['items' => ['Add at least one product to checkout.']]);
        }

        return StoreOrder::query()->create([
            'tenant_id' => $tenantId,
            'customer_name' => $data['customer_name'],
            'customer_email' => $data['customer_email'],
            'customer_phone' => $data['customer_phone'] ?? null,
            'fulfillment' => 'click_and_collect',
            'status' => StoreOrderStatus::Confirmed,
            'subtotal_cents' => $subtotal,
            'total_cents' => $subtotal,
            'items' => $items,
            'location_id' => $data['location_id'] ?? null,
            'notes' => $data['notes'] ?? null,
        ]);
    }

    public function paginateOrders(int $tenantId, array $filters = [], int $perPage = 20): LengthAwarePaginator
    {
        $query = StoreOrder::query()->where('tenant_id', $tenantId)->latest();

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        return $query->paginate(min($perPage, 50));
    }

    public function formatProduct(Product $product): array
    {
        return [
            'id' => $product->id,
            'name' => $product->name,
            'description' => $product->store_description ?? $product->description,
            'image_url' => $product->image_url,
            'retail_cents' => (int) $product->retail_cents,
            'sku' => $product->sku,
            'barcode' => $product->barcode,
            'category' => $product->relationLoaded('category') && $product->category ? [
                'id' => $product->category->id,
                'name' => $product->category->name,
            ] : null,
        ];
    }

    public function formatOrder(StoreOrder $order): array
    {
        return [
            'uuid' => $order->uuid,
            'customer_name' => $order->customer_name,
            'customer_email' => $order->customer_email,
            'customer_phone' => $order->customer_phone,
            'fulfillment' => $order->fulfillment,
            'status' => $order->status?->value ?? $order->status,
            'subtotal_cents' => (int) $order->subtotal_cents,
            'total_cents' => (int) $order->total_cents,
            'items' => $order->items ?? [],
            'location_id' => $order->location_id,
            'notes' => $order->notes,
            'created_at' => $order->created_at?->toIso8601String(),
        ];
    }
}
