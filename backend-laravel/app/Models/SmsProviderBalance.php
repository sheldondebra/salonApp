<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SmsProviderBalance extends Model
{
    protected $fillable = [
        'provider',
        'api_key',
        'sender_id',
        'base_url',
        'balance_url',
        'balance_credits',
        'status',
        'last_synced_at',
        'verified_at',
        'meta',
    ];

    protected $hidden = [
        'api_key',
    ];

    protected function casts(): array
    {
        return [
            'api_key' => 'encrypted',
            'last_synced_at' => 'datetime',
            'verified_at' => 'datetime',
            'meta' => 'array',
        ];
    }

    public function syncLogs(): HasMany
    {
        return $this->hasMany(SmsProviderSyncLog::class, 'provider', 'provider');
    }
}
