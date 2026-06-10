<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use App\Models\Concerns\HasUuidRouteKey;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class GiftCard extends Model
{
    use BelongsToTenant, HasUuidRouteKey;

    protected $fillable = [
        'tenant_id',
        'uuid',
        'code',
        'initial_balance_cents',
        'balance_cents',
        'status',
        'recipient_email',
        'recipient_name',
        'purchaser_user_id',
        'client_user_id',
        'expires_at',
        'sale_id',
    ];

    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
        ];
    }

    public function purchaser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'purchaser_user_id');
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(User::class, 'client_user_id');
    }

    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(GiftCardTransaction::class);
    }
}
