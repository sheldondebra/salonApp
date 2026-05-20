<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TenantSmsWallet extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'balance_credits',
        'total_purchased',
        'total_allocated',
        'total_used',
        'low_balance_threshold',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(SmsWalletTransaction::class, 'tenant_id', 'tenant_id');
    }

    public function isLowBalance(): bool
    {
        return $this->balance_credits <= $this->low_balance_threshold;
    }
}
