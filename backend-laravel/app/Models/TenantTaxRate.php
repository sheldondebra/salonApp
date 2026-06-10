<?php

namespace App\Models;

use App\Enums\TaxAppliesTo;
use App\Enums\TaxMode;
use App\Models\Concerns\BelongsToTenant;
use App\Models\Concerns\FixesPgsqlBooleans;
use Illuminate\Database\Eloquent\Model;

class TenantTaxRate extends Model
{
    use BelongsToTenant, FixesPgsqlBooleans;

    protected $fillable = [
        'tenant_id',
        'name',
        'rate',
        'applies_to',
        'inclusive_or_exclusive',
        'is_active',
        'is_default',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'rate' => 'decimal:2',
            'applies_to' => TaxAppliesTo::class,
            'inclusive_or_exclusive' => TaxMode::class,
            'is_active' => 'boolean',
            'is_default' => 'boolean',
        ];
    }
}
