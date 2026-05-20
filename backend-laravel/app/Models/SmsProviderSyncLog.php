<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SmsProviderSyncLog extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'provider',
        'status',
        'balance_before',
        'balance_after',
        'message',
        'payload',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'payload' => 'array',
            'created_at' => 'datetime',
        ];
    }
}
