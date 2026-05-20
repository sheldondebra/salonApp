<?php

namespace App\Models;

use App\Enums\PaymentPurpose;
use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class PaymentTransaction extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'appointment_id',
        'sale_id',
        'user_id',
        'coupon_id',
        'uuid',
        'provider',
        'purpose',
        'provider_reference',
        'subtotal_cents',
        'discount_cents',
        'amount_cents',
        'currency',
        'status',
        'failure_reason',
        'paid_at',
        'payload',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'purpose' => PaymentPurpose::class,
            'paid_at' => 'datetime',
            'payload' => 'array',
            'metadata' => 'array',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (PaymentTransaction $transaction) {
            $transaction->uuid ??= (string) Str::uuid();
        });
    }

    public function appointment(): BelongsTo
    {
        return $this->belongsTo(Appointment::class);
    }

    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function coupon(): BelongsTo
    {
        return $this->belongsTo(Coupon::class);
    }

    public function isPaid(): bool
    {
        return $this->status === 'paid';
    }
}
