<?php

namespace App\Models;

use App\Enums\FinanceAdjustmentDirection;
use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TenantFinanceAdjustment extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'ledger_reference',
        'source_type',
        'source_id',
        'direction',
        'amount_cents',
        'currency',
        'reason',
        'notes',
        'created_by_user_id',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'direction' => FinanceAdjustmentDirection::class,
            'metadata' => 'array',
        ];
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }
}
