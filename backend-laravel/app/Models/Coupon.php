<?php

namespace App\Models;

use App\Enums\CouponScope;
use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Coupon extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'code',
        'type',
        'value',
        'scope',
        'starts_at',
        'max_redemptions',
        'redemptions_count',
        'expires_at',
        'is_active',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'scope' => CouponScope::class,
            'starts_at' => 'datetime',
            'expires_at' => 'datetime',
            'is_active' => 'boolean',
            'metadata' => 'array',
        ];
    }

    public function subscriptions(): HasMany
    {
        return $this->hasMany(PlatformSubscription::class);
    }

    public function paymentTransactions(): HasMany
    {
        return $this->hasMany(PaymentTransaction::class);
    }

    public function isValid(): bool
    {
        if (! $this->is_active) {
            return false;
        }

        if ($this->starts_at && $this->starts_at->isFuture()) {
            return false;
        }

        if ($this->expires_at && $this->expires_at->isPast()) {
            return false;
        }

        if ($this->max_redemptions !== null && $this->redemptions_count >= $this->max_redemptions) {
            return false;
        }

        return true;
    }

    public function isPlatformWide(): bool
    {
        return $this->tenant_id === null;
    }
}
