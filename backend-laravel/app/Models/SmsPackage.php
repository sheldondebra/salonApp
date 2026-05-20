<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SmsPackage extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'sms_credits',
        'bonus_credits',
        'price_cents',
        'currency',
        'validity_days',
        'description',
        'sort_order',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    public function purchaseInvoices(): HasMany
    {
        return $this->hasMany(SmsPurchaseInvoice::class);
    }

    public function totalCredits(): int
    {
        return (int) $this->sms_credits + (int) $this->bonus_credits;
    }
}
