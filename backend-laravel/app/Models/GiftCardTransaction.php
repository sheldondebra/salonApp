<?php

namespace App\Models;

use App\Enums\GiftCardTransactionType;
use App\Models\Concerns\BelongsToTenant;
use App\Models\Concerns\HasUuidRouteKey;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GiftCardTransaction extends Model
{
    use BelongsToTenant, HasUuidRouteKey;

    protected $fillable = [
        'tenant_id',
        'uuid',
        'gift_card_id',
        'type',
        'amount_cents',
        'balance_after_cents',
        'sale_id',
        'user_id',
        'note',
    ];

    protected function casts(): array
    {
        return [
            'type' => GiftCardTransactionType::class,
        ];
    }

    public function giftCard(): BelongsTo
    {
        return $this->belongsTo(GiftCard::class);
    }

    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
