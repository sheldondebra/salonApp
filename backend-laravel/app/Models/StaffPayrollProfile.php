<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use App\Models\Concerns\FixesPgsqlBooleans;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StaffPayrollProfile extends Model
{
    use BelongsToTenant, FixesPgsqlBooleans;

    protected $fillable = [
        'tenant_id',
        'staff_member_id',
        'pay_role_id',
        'pay_type',
        'base_salary_cents',
        'hourly_rate_cents',
        'commission_rate',
        'commission_type',
        'tip_eligible',
        'payout_method',
        'payout_account_name',
        'payout_account_number',
        'effective_from',
        'notes',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'base_salary_cents' => 'integer',
            'hourly_rate_cents' => 'integer',
            'commission_rate' => 'float',
            'tip_eligible' => 'boolean',
            'is_active' => 'boolean',
            'effective_from' => 'date',
        ];
    }

    public function staffMember(): BelongsTo
    {
        return $this->belongsTo(StaffMember::class);
    }

    public function payRole(): BelongsTo
    {
        return $this->belongsTo(StaffPayRole::class, 'pay_role_id');
    }
}
