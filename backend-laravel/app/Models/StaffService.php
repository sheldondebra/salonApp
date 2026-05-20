<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use App\Models\Concerns\FixesPgsqlBooleans;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StaffService extends Model
{
    use BelongsToTenant, FixesPgsqlBooleans;

    protected $fillable = [
        'tenant_id',
        'staff_member_id',
        'service_id',
        'custom_duration_minutes',
        'custom_price_cents',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    public function staffMember(): BelongsTo
    {
        return $this->belongsTo(StaffMember::class);
    }

    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }

    public function effectiveDurationMinutes(): int
    {
        return $this->custom_duration_minutes
            ?? $this->service?->duration_minutes
            ?? 0;
    }

    public function effectivePriceCents(): int
    {
        return $this->custom_price_cents
            ?? $this->service?->price_cents
            ?? 0;
    }
}
