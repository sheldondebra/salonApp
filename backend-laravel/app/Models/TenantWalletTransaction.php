<?php

namespace App\Models;

use App\Enums\WalletTransactionDirection;
use App\Enums\WalletTransactionType;
use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TenantWalletTransaction extends Model
{
    use BelongsToTenant;

    public $timestamps = false;

    protected $fillable = [
        'tenant_id',
        'wallet_id',
        'payment_request_id',
        'settlement_id',
        'type',
        'direction',
        'amount',
        'balance_before',
        'balance_after',
        'reference',
        'description',
        'metadata',
        'created_by_user_id',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'type' => WalletTransactionType::class,
            'direction' => WalletTransactionDirection::class,
            'amount' => 'integer',
            'balance_before' => 'integer',
            'balance_after' => 'integer',
            'metadata' => 'array',
            'created_at' => 'datetime',
        ];
    }

    public function wallet(): BelongsTo
    {
        return $this->belongsTo(TenantWallet::class, 'wallet_id');
    }

    public function paymentRequest(): BelongsTo
    {
        return $this->belongsTo(PaymentRequest::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }
}
