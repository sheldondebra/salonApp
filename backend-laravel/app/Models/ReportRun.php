<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use App\Models\Concerns\HasUuidRouteKey;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReportRun extends Model
{
    use BelongsToTenant, HasUuidRouteKey;

    protected $fillable = [
        'tenant_id',
        'uuid',
        'scheduled_report_id',
        'report_definition_id',
        'status',
        'result_summary',
        'sent_at',
    ];

    protected function casts(): array
    {
        return [
            'result_summary' => 'array',
            'sent_at' => 'datetime',
        ];
    }

    public function scheduledReport(): BelongsTo
    {
        return $this->belongsTo(ScheduledReport::class);
    }

    public function definition(): BelongsTo
    {
        return $this->belongsTo(ReportDefinition::class, 'report_definition_id');
    }
}
