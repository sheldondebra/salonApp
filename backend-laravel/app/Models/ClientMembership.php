<?php

namespace App\Models;

use App\Enums\ClientMembershipStatus;
use App\Models\Concerns\BelongsToTenant;
use App\Models\Concerns\HasUuidRouteKey;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ClientMembership extends Model
{
    use BelongsToTenant, HasUuidRouteKey;

    protected $fillable = [
        'tenant_id',
        'uuid',
        'membership_plan_id',
        'client_user_id',
        'status',
        'starts_at',
        'ends_at',
        'next_billing_at',
        'sold_by_user_id',
        'sale_id',
    ];

    protected function casts(): array
    {
        return [
            'status' => ClientMembershipStatus::class,
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
            'next_billing_at' => 'datetime',
        ];
    }

    public function plan(): BelongsTo
    {
        return $this->belongsTo(MembershipPlan::class, 'membership_plan_id');
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(User::class, 'client_user_id');
    }

    public function soldBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sold_by_user_id');
    }

    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }
}
