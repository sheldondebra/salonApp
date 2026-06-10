<?php

namespace App\Models;

use App\Enums\FeaturedListingStatus;
use App\Models\Concerns\BelongsToTenant;
use App\Models\Concerns\FixesPgsqlBooleans;
use App\Models\Concerns\HasUuidRouteKey;
use Illuminate\Database\Eloquent\Model;

class FeaturedListing extends Model
{
    use BelongsToTenant, FixesPgsqlBooleans, HasUuidRouteKey;

    protected $fillable = [
        'tenant_id',
        'uuid',
        'placement',
        'starts_at',
        'ends_at',
        'is_sponsored',
        'billing_cents',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
            'is_sponsored' => 'boolean',
            'status' => FeaturedListingStatus::class,
        ];
    }
}
