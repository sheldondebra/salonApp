<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class CheckoutSession extends Model
{
    use BelongsToTenant;

    public function getRouteKeyName(): string
    {
        return 'uuid';
    }

    protected $fillable = [
        'uuid',
        'tenant_id',
        'location_id',
        'client_user_id',
        'appointment_id',
        'created_by_user_id',
        'sale_id',
        'status',
        'items',
        'coupon_code',
        'tax_cents',
        'service_charge_cents',
        'tip_cents',
        'payment_method',
        'notes',
        'expires_at',
    ];

    protected function casts(): array
    {
        return [
            'items' => 'array',
            'tax_cents' => 'integer',
            'service_charge_cents' => 'integer',
            'tip_cents' => 'integer',
            'expires_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (CheckoutSession $session) {
            if (! $session->uuid) {
                $session->uuid = (string) Str::uuid();
            }
            if (! $session->expires_at) {
                $session->expires_at = now()->addHours(8);
            }
        });
    }

    public function location(): BelongsTo
    {
        return $this->belongsTo(Location::class);
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(User::class, 'client_user_id');
    }

    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }
}
