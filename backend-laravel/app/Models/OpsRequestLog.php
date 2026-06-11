<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OpsRequestLog extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'method',
        'uri',
        'route_name',
        'route_action',
        'status_code',
        'duration_ms',
        'user_id',
        'tenant_slug',
        'ip',
        'user_agent',
        'client_channel',
        'error_message',
        'response_excerpt',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'created_at' => 'datetime',
        ];
    }

    public function isError(): bool
    {
        return $this->status_code >= 400;
    }
}
