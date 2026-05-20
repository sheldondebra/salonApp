<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SmsProviderBalance extends Model
{
    protected $fillable = [
        'provider',
        'balance_credits',
        'status',
        'last_synced_at',
        'meta',
    ];

    protected function casts(): array
    {
        return [
            'last_synced_at' => 'datetime',
            'meta' => 'array',
        ];
    }

    public function syncLogs(): HasMany
    {
        return $this->hasMany(SmsProviderSyncLog::class, 'provider', 'provider');
    }
}
