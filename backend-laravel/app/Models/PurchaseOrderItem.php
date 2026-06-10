<?php

namespace App\Models;

use App\Models\Concerns\HasUuidRouteKey;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PurchaseOrderItem extends Model
{
    use HasUuidRouteKey;

    protected $fillable = [
        'purchase_order_id',
        'uuid',
        'product_id',
        'quantity_ordered',
        'quantity_received',
        'unit_cost_cents',
    ];

    public function purchaseOrder(): BelongsTo
    {
        return $this->belongsTo(PurchaseOrder::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
