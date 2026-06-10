<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use App\Models\Concerns\FixesPgsqlBooleans;
use App\Models\Concerns\HasUuidRouteKey;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MarketplaceProfile extends Model
{
    use BelongsToTenant, FixesPgsqlBooleans, HasUuidRouteKey;

    protected $fillable = [
        'tenant_id',
        'uuid',
        'headline',
        'bio',
        'categories',
        'photos',
        'is_published',
        'average_rating',
        'review_count',
        'published_at',
    ];

    protected function casts(): array
    {
        return [
            'categories' => 'array',
            'photos' => 'array',
            'is_published' => 'boolean',
            'average_rating' => 'decimal:2',
            'published_at' => 'datetime',
        ];
    }

    public function tenantModel(): BelongsTo
    {
        return $this->belongsTo(Tenant::class, 'tenant_id');
    }
}
