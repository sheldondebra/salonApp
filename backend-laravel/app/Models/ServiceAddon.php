<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ServiceAddon extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'service_id',
        'name',
        'price_cents',
        'extra_minutes',
        'sort_order',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'price_cents' => 'integer',
            'extra_minutes' => 'integer',
            'sort_order' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }
}
