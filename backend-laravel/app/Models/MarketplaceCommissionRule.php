<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use App\Models\Concerns\FixesPgsqlBooleans;
use App\Models\Concerns\HasUuidRouteKey;
use Illuminate\Database\Eloquent\Model;

class MarketplaceCommissionRule extends Model
{
    use BelongsToTenant, FixesPgsqlBooleans, HasUuidRouteKey;

    protected $fillable = [
        'tenant_id',
        'uuid',
        'name',
        'percent',
        'flat_fee_cents',
        'applies_to',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }
}
