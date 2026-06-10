<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use App\Models\Concerns\FixesPgsqlBooleans;
use App\Models\Concerns\HasUuidRouteKey;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MembershipPlan extends Model
{
    use BelongsToTenant, FixesPgsqlBooleans, HasUuidRouteKey;

    protected $fillable = [
        'tenant_id',
        'uuid',
        'name',
        'description',
        'price_cents',
        'billing_interval',
        'discount_percent',
        'free_service_ids',
        'priority_booking',
        'points_multiplier',
        'is_active',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'free_service_ids' => 'array',
            'priority_booking' => 'boolean',
            'points_multiplier' => 'decimal:2',
            'is_active' => 'boolean',
        ];
    }

    public function clientMemberships(): HasMany
    {
        return $this->hasMany(ClientMembership::class);
    }
}
