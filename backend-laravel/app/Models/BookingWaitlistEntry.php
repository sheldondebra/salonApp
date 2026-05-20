<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class BookingWaitlistEntry extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'uuid',
        'client_user_id',
        'client_name',
        'client_email',
        'client_phone',
        'location_id',
        'staff_member_id',
        'service_ids',
        'preferred_date',
        'preferred_time',
        'party_size',
        'status',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'service_ids' => 'array',
            'preferred_date' => 'date',
            'party_size' => 'integer',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (BookingWaitlistEntry $entry) {
            $entry->uuid ??= (string) Str::uuid();
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

    public function staffMember(): BelongsTo
    {
        return $this->belongsTo(StaffMember::class);
    }
}
