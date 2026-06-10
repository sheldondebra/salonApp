<?php

namespace App\Models;

use App\Enums\PackageBalanceStatus;
use App\Models\Concerns\BelongsToTenant;
use App\Models\Concerns\HasUuidRouteKey;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ClientPackageBalance extends Model
{
    use BelongsToTenant, HasUuidRouteKey;

    protected $fillable = [
        'tenant_id',
        'uuid',
        'service_package_id',
        'client_user_id',
        'sessions_total',
        'sessions_remaining',
        'expires_at',
        'status',
        'sold_by_user_id',
        'sale_id',
    ];

    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
            'status' => PackageBalanceStatus::class,
        ];
    }

    public function package(): BelongsTo
    {
        return $this->belongsTo(ServicePackage::class, 'service_package_id');
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

    public function redemptions(): HasMany
    {
        return $this->hasMany(PackageRedemption::class);
    }
}
