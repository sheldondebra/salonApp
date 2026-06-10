<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use App\Models\Concerns\FixesPgsqlBooleans;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Product extends Model
{
    use BelongsToTenant, FixesPgsqlBooleans;

    protected $fillable = [
        'tenant_id',
        'product_category_id',
        'supplier_id',
        'name',
        'sku',
        'barcode',
        'description',
        'store_description',
        'image_url',
        'cost_cents',
        'retail_cents',
        'low_stock_threshold',
        'is_active',
        'is_store_visible',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'is_store_visible' => 'boolean',
        ];
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(ProductCategory::class, 'product_category_id');
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    public function stocks(): HasMany
    {
        return $this->hasMany(InventoryStock::class);
    }

    public function movements(): HasMany
    {
        return $this->hasMany(StockMovement::class);
    }

    public function bundleItems(): HasMany
    {
        return $this->hasMany(ProductBundleItem::class);
    }
}
