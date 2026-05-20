<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class BookingGroup extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'uuid',
        'client_user_id',
        'location_id',
        'party_size',
        'booking_type',
        'recurrence',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'recurrence' => 'array',
            'party_size' => 'integer',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (BookingGroup $group) {
            $group->uuid ??= (string) Str::uuid();
        });
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(User::class, 'client_user_id');
    }

    public function location(): BelongsTo
    {
        return $this->belongsTo(Location::class);
    }

    public function appointments(): HasMany
    {
        return $this->hasMany(Appointment::class);
    }
}
