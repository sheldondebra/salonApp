<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BookingAttribution extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'appointment_id',
        'source',
        'medium',
        'campaign',
        'referrer',
    ];

    public function appointment(): BelongsTo
    {
        return $this->belongsTo(Appointment::class);
    }
}
