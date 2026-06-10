<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use App\Models\Concerns\FixesPgsqlBooleans;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StaffBreak extends Model
{
    use BelongsToTenant, FixesPgsqlBooleans;

    protected $fillable = [
        'tenant_id',
        'staff_member_id',
        'location_id',
        'title',
        'break_type',
        'day_of_week',
        'start_time',
        'end_time',
        'repeats_weekly',
        'date',
        'note',
    ];

    protected function casts(): array
    {
        return [
            'repeats_weekly' => 'boolean',
            'date' => 'date',
        ];
    }

    public function staffMember(): BelongsTo
    {
        return $this->belongsTo(StaffMember::class);
    }

    public function location(): BelongsTo
    {
        return $this->belongsTo(Location::class);
    }
}
