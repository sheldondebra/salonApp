<?php

namespace App\Models;

use App\Enums\StoreOrderStatus;
use App\Models\Concerns\BelongsToTenant;
use App\Models\Concerns\HasUuidRouteKey;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StoreOrder extends Model
{
    use BelongsToTenant, HasUuidRouteKey;

    protected $fillable = [
        'tenant_id',
        'uuid',
        'customer_name',
        'customer_email',
        'customer_phone',
        'fulfillment',
        'status',
        'subtotal_cents',
        'total_cents',
        'items',
        'location_id',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'status' => StoreOrderStatus::class,
            'items' => 'array',
        ];
    }

    public function location(): BelongsTo
    {
        return $this->belongsTo(Location::class);
    }
}
