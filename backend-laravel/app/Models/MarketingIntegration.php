<?php

namespace App\Models;

use App\Enums\MarketingIntegrationProvider;
use App\Models\Concerns\BelongsToTenant;
use App\Models\Concerns\FixesPgsqlBooleans;
use Illuminate\Database\Eloquent\Model;

class MarketingIntegration extends Model
{
    use BelongsToTenant, FixesPgsqlBooleans;

    protected $fillable = [
        'tenant_id',
        'provider',
        'config',
        'is_active',
        'consent_required',
    ];

    protected function casts(): array
    {
        return [
            'provider' => MarketingIntegrationProvider::class,
            'config' => 'array',
            'is_active' => 'boolean',
            'consent_required' => 'boolean',
        ];
    }
}
