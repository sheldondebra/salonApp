<?php

namespace App\Services;

use App\Enums\PurchaseOrderStatus;
use App\Enums\StockMovementType;
use App\Models\Product;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderItem;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class PurchaseOrderService
{
    public function __construct(
        private readonly InventoryService $inventory,
    ) {}

    public function paginate(int $tenantId, array $filters = [], int $perPage = 20): LengthAwarePaginator
    {
        $query = PurchaseOrder::query()
            ->where('tenant_id', $tenantId)
            ->with(['supplier', 'location', 'items.product'])
            ->latest();

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (! empty($filters['supplier_id'])) {
            $query->where('supplier_id', (int) $filters['supplier_id']);
        }

        return $query->paginate(min($perPage, 50));
    }

    public function create(int $tenantId, array $data, ?User $actor = null): PurchaseOrder
    {
        return DB::transaction(function () use ($tenantId, $data, $actor) {
            $order = PurchaseOrder::query()->create([
                'tenant_id' => $tenantId,
                'supplier_id' => $data['supplier_id'],
                'location_id' => $data['location_id'] ?? null,
                'reference' => $data['reference'] ?? 'PO-'.Str::upper(Str::random(8)),
                'status' => PurchaseOrderStatus::Draft,
                'notes' => $data['notes'] ?? null,
                'created_by_user_id' => $actor?->id,
            ]);

            $this->syncItems($order, $data['items'] ?? []);

            return $order->fresh(['supplier', 'location', 'items.product']);
        });
    }

    public function update(PurchaseOrder $order, array $data): PurchaseOrder
    {
        if (in_array($order->status, [PurchaseOrderStatus::Received, PurchaseOrderStatus::Cancelled], true)) {
            throw ValidationException::withMessages(['purchase_order' => ['Received or cancelled purchase orders cannot be edited.']]);
        }

        return DB::transaction(function () use ($order, $data) {
            $order->fill(array_filter([
                'supplier_id' => $data['supplier_id'] ?? null,
                'location_id' => $data['location_id'] ?? $order->location_id,
                'reference' => $data['reference'] ?? $order->reference,
                'notes' => array_key_exists('notes', $data) ? $data['notes'] : $order->notes,
            ], fn ($value) => $value !== null))->save();

            if (array_key_exists('items', $data)) {
                $this->syncItems($order, $data['items'] ?? []);
            }

            return $order->fresh(['supplier', 'location', 'items.product']);
        });
    }

    public function send(PurchaseOrder $order): PurchaseOrder
    {
        $order->update([
            'status' => PurchaseOrderStatus::Sent,
            'sent_at' => now(),
        ]);

        return $order->fresh(['supplier', 'location', 'items.product']);
    }

    public function receive(PurchaseOrder $order, array $data, ?User $actor = null): PurchaseOrder
    {
        if (! in_array($order->status, [PurchaseOrderStatus::Draft, PurchaseOrderStatus::Sent, PurchaseOrderStatus::PartiallyReceived], true)) {
            throw ValidationException::withMessages(['purchase_order' => ['This purchase order cannot be received.']]);
        }

        DB::transaction(function () use ($order, $data, $actor) {
            $order->loadMissing('items.product');
            $updates = collect($data['items'] ?? [])->keyBy('uuid');

            foreach ($order->items as $item) {
                $row = $updates->get($item->uuid);
                if (! $row) {
                    continue;
                }

                $incoming = max(0, (int) ($row['quantity_received'] ?? 0));
                $remaining = max(0, $item->quantity_ordered - $item->quantity_received);
                $delta = min($remaining, $incoming);

                if ($delta === 0) {
                    continue;
                }

                $item->increment('quantity_received', $delta);

                $product = Product::query()->where('tenant_id', $order->tenant_id)->findOrFail($item->product_id);
                $this->inventory->adjustStock(
                    $product,
                    $order->location_id ?? (int) ($data['location_id'] ?? 0),
                    $delta,
                    StockMovementType::Purchase,
                    'purchase_order_receive',
                    $order->reference,
                    $actor,
                    purchaseOrderId: $order->id,
                );
            }

            $order->refresh()->load('items');
            $allReceived = $order->items->every(fn (PurchaseOrderItem $item) => $item->quantity_received >= $item->quantity_ordered);

            $order->update([
                'status' => $allReceived ? PurchaseOrderStatus::Received : PurchaseOrderStatus::PartiallyReceived,
                'received_at' => now(),
            ]);
        });

        return $order->fresh(['supplier', 'location', 'items.product']);
    }

    public function format(PurchaseOrder $order): array
    {
        $order->loadMissing(['supplier', 'location', 'items.product']);

        return [
            'uuid' => $order->uuid,
            'reference' => $order->reference,
            'status' => $order->status?->value ?? $order->status,
            'notes' => $order->notes,
            'sent_at' => $order->sent_at?->toIso8601String(),
            'received_at' => $order->received_at?->toIso8601String(),
            'supplier' => $order->supplier ? ['id' => $order->supplier->id, 'name' => $order->supplier->name] : null,
            'location' => $order->location ? ['id' => $order->location->id, 'name' => $order->location->name] : null,
            'items' => $order->items->map(fn (PurchaseOrderItem $item) => [
                'uuid' => $item->uuid,
                'product_id' => $item->product_id,
                'product_name' => $item->product?->name,
                'quantity_ordered' => (int) $item->quantity_ordered,
                'quantity_received' => (int) $item->quantity_received,
                'unit_cost_cents' => (int) $item->unit_cost_cents,
            ])->values()->all(),
        ];
    }

    private function syncItems(PurchaseOrder $order, array $items): void
    {
        $order->items()->delete();

        foreach ($items as $item) {
            $order->items()->create([
                'product_id' => $item['product_id'],
                'quantity_ordered' => (int) $item['quantity_ordered'],
                'quantity_received' => (int) ($item['quantity_received'] ?? 0),
                'unit_cost_cents' => (int) ($item['unit_cost_cents'] ?? 0),
            ]);
        }
    }
}
