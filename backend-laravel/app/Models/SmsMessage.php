<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SmsMessage extends Model
{
    protected $fillable = [
        'tenant_id',
        'provider',
        'type',
        'recipient',
        'status',
        'body',
        'response',
        'meta',
        'sent_at',
    ];

    protected function casts(): array
    {
        return [
            'response' => 'array',
            'meta' => 'array',
            'sent_at' => 'datetime',
        ];
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }
}
