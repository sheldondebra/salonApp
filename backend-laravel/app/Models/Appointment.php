<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Appointment extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'booking_group_id',
        'uuid',
        'client_user_id',
        'staff_member_id',
        'service_id',
        'location_id',
        'starts_at',
        'ends_at',
        'status',
        'booked_via',
        'payment_status',
        'amount_due_cents',
        'deposit_paid_cents',
        'payment_reference',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (Appointment $appointment) {
            $appointment->uuid ??= (string) Str::uuid();
        });
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(User::class, 'client_user_id');
    }

    public function staffMember(): BelongsTo
    {
        return $this->belongsTo(StaffMember::class);
    }

    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }

    public function location(): BelongsTo
    {
        return $this->belongsTo(Location::class);
    }

    public function bookingGroup(): BelongsTo
    {
        return $this->belongsTo(BookingGroup::class);
    }

    public function paymentTransactions(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(PaymentTransaction::class);
    }

    public function attributions(): HasMany
    {
        return $this->hasMany(BookingAttribution::class);
    }
}
