<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use App\Models\Concerns\FixesPgsqlBooleans;
use Illuminate\Database\Eloquent\Model;

class WhiteLabelSetting extends Model
{
    use BelongsToTenant, FixesPgsqlBooleans;

    protected $fillable = [
        'tenant_id',
        'app_name',
        'app_tagline',
        'mobile_theme',
        'custom_domains',
        'is_enabled',
        'plan_required',
    ];

    protected function casts(): array
    {
        return [
            'mobile_theme' => 'array',
            'custom_domains' => 'array',
            'is_enabled' => 'boolean',
        ];
    }
}
