<?php

namespace App\Http\Resources;

use App\Services\InventoryService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $locationId = $request->filled('location_id') ? $request->integer('location_id') : null;
        $threshold = (int) $this->low_stock_threshold;

        if ($this->relationLoaded('stocks')) {
            $stockRows = $locationId
                ? $this->stocks->where('location_id', $locationId)
                : $this->stocks;
            $totalQty = (int) $stockRows->sum('quantity');
        } else {
            $totalQty = app(InventoryService::class)->productQuantity($this->resource, $locationId);
        }

        return [
            'id' => $this->id,
            'name' => $this->name,
            'sku' => $this->sku,
            'barcode' => $this->barcode,
            'description' => $this->description,
            'image_url' => $this->image_url,
            'cost_cents' => $this->cost_cents,
            'retail_cents' => $this->retail_cents,
            'low_stock_threshold' => $threshold,
            'is_active' => $this->is_active,
            'total_quantity' => $totalQty,
            'is_low_stock' => $totalQty <= $threshold,
            'category' => $this->whenLoaded('category', fn () => [
                'id' => $this->category->id,
                'name' => $this->category->name,
            ]),
            'supplier' => $this->whenLoaded('supplier', fn () => [
                'id' => $this->supplier->id,
                'name' => $this->supplier->name,
            ]),
            'stocks' => $this->whenLoaded('stocks', fn () => $this->stocks->map(fn ($s) => [
                'location_id' => $s->location_id,
                'location_name' => $s->relationLoaded('location') ? $s->location?->name : null,
                'quantity' => (int) $s->quantity,
            ])),
        ];
    }
}
