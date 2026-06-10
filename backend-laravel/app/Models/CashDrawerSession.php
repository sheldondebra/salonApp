<?php

namespace App\Models;

use App\Enums\CashDrawerSessionStatus;
use App\Models\Concerns\BelongsToTenant;
use App\Models\Concerns\HasUuidRouteKey;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class CashDrawerSession extends Model
{
    use BelongsToTenant, HasUuidRouteKey;

    protected $fillable = [
        'tenant_id',
        'uuid',
        'location_id',
        'opened_by_user_id',
        'closed_by_user_id',
        'opening_cash_cents',
        'expected_cash_cents',
        'counted_cash_cents',
        'difference_cents',
        'status',
        'payment_breakdown',
        'opening_notes',
        'closing_notes',
        'opened_at',
        'closed_at',
    ];

    protected function casts(): array
    {
        return [
            'status' => CashDrawerSessionStatus::class,
            'payment_breakdown' => 'array',
            'opened_at' => 'datetime',
            'closed_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (CashDrawerSession $session) {
            $session->uuid ??= (string) Str::uuid();
        });
    }

    public function location(): BelongsTo
    {
        return $this->belongsTo(Location::class);
    }

    public function openedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'opened_by_user_id');
    }

    public function closedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'closed_by_user_id');
    }
}
