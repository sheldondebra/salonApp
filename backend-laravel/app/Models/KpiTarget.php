<?php

namespace App\Models;

use App\Enums\KpiMetric;
use App\Models\Concerns\BelongsToTenant;
use App\Models\Concerns\HasUuidRouteKey;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class KpiTarget extends Model
{
    use BelongsToTenant, HasUuidRouteKey;

    protected $fillable = [
        'tenant_id',
        'uuid',
        'metric',
        'period',
        'target_value',
        'location_id',
        'staff_member_id',
        'period_start',
        'period_end',
    ];

    protected function casts(): array
    {
        return [
            'metric' => KpiMetric::class,
            'period_start' => 'date',
            'period_end' => 'date',
        ];
    }

    public function location(): BelongsTo
    {
        return $this->belongsTo(Location::class);
    }

    public function staffMember(): BelongsTo
    {
        return $this->belongsTo(StaffMember::class);
    }
}
