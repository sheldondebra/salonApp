<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use App\Models\Concerns\HasUuidRouteKey;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ReportDefinition extends Model
{
    use BelongsToTenant, HasUuidRouteKey;

    protected $fillable = [
        'tenant_id',
        'uuid',
        'name',
        'report_type',
        'config',
        'created_by_user_id',
    ];

    protected function casts(): array
    {
        return [
            'config' => 'array',
        ];
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    public function schedules(): HasMany
    {
        return $this->hasMany(ScheduledReport::class);
    }

    public function runs(): HasMany
    {
        return $this->hasMany(ReportRun::class);
    }
}
