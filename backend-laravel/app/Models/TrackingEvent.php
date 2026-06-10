<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;

class TrackingEvent extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'provider',
        'event_name',
        'payload',
        'session_id',
    ];

    protected function casts(): array
    {
        return [
            'payload' => 'array',
        ];
    }
}
