<?php

namespace App\Models;

use App\Enums\SaleStatus;
use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Str;

class Sale extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'location_id',
        'uuid',
        'sale_number',
        'client_user_id',
        'appointment_id',
        'coupon_id',
        'created_by_user_id',
        'status',
        'subtotal_cents',
        'discount_cents',
        'tax_cents',
        'service_charge_cents',
        'tip_cents',
        'total_cents',
        'currency',
        'payment_method',
        'coupon_code',
        'notes',
        'metadata',
        'completed_at',
    ];

    protected function casts(): array
    {
        return [
            'status' => SaleStatus::class,
            'completed_at' => 'datetime',
            'metadata' => 'array',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (Sale $sale) {
            $sale->uuid ??= (string) Str::uuid();
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

    public function appointment(): BelongsTo
    {
        return $this->belongsTo(Appointment::class);
    }

    public function coupon(): BelongsTo
    {
        return $this->belongsTo(Coupon::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(SaleItem::class);
    }

    public function payment(): HasOne
    {
        return $this->hasOne(PaymentTransaction::class);
    }
}
