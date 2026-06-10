<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use App\Models\Concerns\FixesPgsqlBooleans;
use App\Models\Concerns\HasUuidRouteKey;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ScheduledReport extends Model
{
    use BelongsToTenant, FixesPgsqlBooleans, HasUuidRouteKey;

    protected $fillable = [
        'tenant_id',
        'uuid',
        'report_definition_id',
        'frequency',
        'recipients',
        'is_active',
        'next_run_at',
        'last_run_at',
    ];

    protected function casts(): array
    {
        return [
            'recipients' => 'array',
            'is_active' => 'boolean',
            'next_run_at' => 'datetime',
            'last_run_at' => 'datetime',
        ];
    }

    public function definition(): BelongsTo
    {
        return $this->belongsTo(ReportDefinition::class, 'report_definition_id');
    }

    public function runs(): HasMany
    {
        return $this->hasMany(ReportRun::class);
    }
}
