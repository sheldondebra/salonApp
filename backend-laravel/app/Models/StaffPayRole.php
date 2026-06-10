<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class StaffPayRole extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'name',
        'description',
        'pay_type',
        'base_salary_cents',
        'hourly_rate_cents',
        'commission_rate',
        'commission_type',
        'tip_eligible',
        'color',
        'sort_order',
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
            'sort_order' => 'integer',
        ];
    }

    public function payrollProfiles(): HasMany
    {
        return $this->hasMany(StaffPayrollProfile::class, 'pay_role_id');
    }
}
