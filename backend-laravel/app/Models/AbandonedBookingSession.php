<?php

namespace App\Models;

use App\Enums\AbandonedBookingStatus;
use App\Models\Concerns\BelongsToTenant;
use App\Models\Concerns\HasUuidRouteKey;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AbandonedBookingSession extends Model
{
    use BelongsToTenant, HasUuidRouteKey;

    protected $fillable = [
        'tenant_id',
        'uuid',
        'client_email',
        'client_phone',
        'client_name',
        'draft',
        'status',
        'last_activity_at',
        'recovered_at',
        'recovered_appointment_id',
        'reminder_count',
        'last_reminder_at',
        'source',
    ];

    protected function casts(): array
    {
        return [
            'draft' => 'array',
            'status' => AbandonedBookingStatus::class,
            'last_activity_at' => 'datetime',
            'recovered_at' => 'datetime',
            'last_reminder_at' => 'datetime',
        ];
    }

    public function recoveredAppointment(): BelongsTo
    {
        return $this->belongsTo(Appointment::class, 'recovered_appointment_id');
    }
}
