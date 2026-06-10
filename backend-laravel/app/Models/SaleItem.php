<?php

namespace App\Models;

use App\Enums\SaleItemType;
use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SaleItem extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'sale_id',
        'tenant_id',
        'item_type',
        'service_id',
        'product_id',
        'service_addon_id',
        'name',
        'quantity',
        'unit_price_cents',
        'line_total_cents',
    ];

    protected function casts(): array
    {
        return [
            'item_type' => SaleItemType::class,
        ];
    }

    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }

    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function serviceAddon(): BelongsTo
    {
        return $this->belongsTo(ServiceAddon::class);
    }
}
