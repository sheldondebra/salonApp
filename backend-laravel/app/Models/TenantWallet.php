<?php

namespace App\Models;

use App\Enums\WalletStatus;
use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TenantWallet extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'currency',
        'available_balance',
        'pending_balance',
        'total_collected',
        'total_fees',
        'total_settled',
        'total_refunded',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'status' => WalletStatus::class,
            'available_balance' => 'integer',
            'pending_balance' => 'integer',
            'total_collected' => 'integer',
            'total_fees' => 'integer',
            'total_settled' => 'integer',
            'total_refunded' => 'integer',
        ];
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(TenantWalletTransaction::class, 'wallet_id');
    }
}
