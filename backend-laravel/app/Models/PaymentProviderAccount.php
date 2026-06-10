<?php

namespace App\Models;

use App\Enums\PaymentProviderName;
use App\Enums\ProviderAccountStatus;
use App\Enums\ProviderAccountType;
use App\Enums\ProviderEnvironment;
use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PaymentProviderAccount extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'provider',
        'account_type',
        'environment',
        'country',
        'currency',
        'api_user',
        'api_key',
        'subscription_key',
        'target_environment',
        'callback_host',
        'status',
        'last_health_check_at',
        'last_successful_token_at',
        'last_balance_sync_at',
        'last_error',
    ];

    protected $hidden = [
        'api_user',
        'api_key',
        'subscription_key',
    ];

    protected function casts(): array
    {
        return [
            'provider' => PaymentProviderName::class,
            'account_type' => ProviderAccountType::class,
            'environment' => ProviderEnvironment::class,
            'status' => ProviderAccountStatus::class,
            'api_user' => 'encrypted',
            'api_key' => 'encrypted',
            'subscription_key' => 'encrypted',
            'last_health_check_at' => 'datetime',
            'last_successful_token_at' => 'datetime',
            'last_balance_sync_at' => 'datetime',
        ];
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function scopePlatform(Builder $query): Builder
    {
        return $query
            ->withoutGlobalScope('tenant')
            ->whereNull('tenant_id')
            ->where('account_type', ProviderAccountType::Platform->value);
    }

    public function scopeForProvider(Builder $query, PaymentProviderName $provider): Builder
    {
        return $query->where('provider', $provider->value);
    }

    public function hasStoredCredentials(): bool
    {
        return filled($this->api_user) && filled($this->api_key) && filled($this->subscription_key);
    }
}
