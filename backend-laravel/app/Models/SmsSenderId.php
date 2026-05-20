<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;

class SmsSenderId extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'sender_id',
        'status',
        'is_default',
        'approved_at',
        'meta',
    ];

    protected function casts(): array
    {
        return [
            'is_default' => 'boolean',
            'approved_at' => 'datetime',
            'meta' => 'array',
        ];
    }
}
