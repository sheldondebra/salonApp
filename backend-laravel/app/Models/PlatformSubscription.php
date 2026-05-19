<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Str;

class PlatformSubscription extends Model
{
    protected $fillable = [
        'uuid',
        'user_id',
        'plan_id',
        'status',
        'amount_cents',
        'discount_cents',
        'final_amount_cents',
        'currency',
        'coupon_id',
        'provider',
        'provider_reference',
        'paid_at',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'paid_at' => 'datetime',
            'metadata' => 'array',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (PlatformSubscription $sub) {
            $sub->uuid ??= (string) Str::uuid();
        });
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function coupon(): BelongsTo
    {
        return $this->belongsTo(Coupon::class);
    }

    public function invoice(): HasOne
    {
        return $this->hasOne(BillingInvoice::class, 'platform_subscription_id');
    }

    public function isPaid(): bool
    {
        return $this->status === 'paid';
    }
}
