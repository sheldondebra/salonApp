<?php

namespace App\Models;

use App\Enums\TenantDomainType;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class TenantDomain extends Model
{
    protected $fillable = [
        'tenant_id',
        'domain',
        'type',
        'verification_token',
        'is_primary',
        'verified_at',
    ];

    protected function casts(): array
    {
        return [
            'type' => TenantDomainType::class,
            'is_primary' => 'boolean',
            'verified_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (TenantDomain $domain) {
            if ($domain->type === TenantDomainType::Custom && ! $domain->verification_token) {
                $domain->verification_token = Str::random(32);
            }
        });
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function scopeVerified(Builder $query): Builder
    {
        return $query->whereNotNull('verified_at');
    }

    public function scopeCustom(Builder $query): Builder
    {
        return $query->where('type', TenantDomainType::Custom);
    }

    public function isVerified(): bool
    {
        return $this->verified_at !== null;
    }
}
