<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LoyaltyTransaction extends Model
{
    protected $fillable = [
        'loyalty_wallet_id',
        'points',
        'type',
        'description',
        'appointment_id',
    ];

    public function wallet(): BelongsTo
    {
        return $this->belongsTo(LoyaltyWallet::class, 'loyalty_wallet_id');
    }

    public function appointment(): BelongsTo
    {
        return $this->belongsTo(Appointment::class);
    }
}
