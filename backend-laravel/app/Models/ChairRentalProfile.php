<?php

namespace App\Models;

use App\Enums\ChairRentalBillingInterval;
use App\Models\Concerns\BelongsToTenant;
use App\Models\Concerns\FixesPgsqlBooleans;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ChairRentalProfile extends Model
{
    use BelongsToTenant, FixesPgsqlBooleans;

    protected $fillable = [
        'tenant_id',
        'staff_member_id',
        'rental_fee_cents',
        'billing_interval',
        'schedule',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'billing_interval' => ChairRentalBillingInterval::class,
            'schedule' => 'array',
            'is_active' => 'boolean',
        ];
    }

    public function staffMember(): BelongsTo
    {
        return $this->belongsTo(StaffMember::class);
    }
}
