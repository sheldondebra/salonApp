<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ClientMedia extends Model
{
    use BelongsToTenant;

    protected $table = 'client_media';

    protected $fillable = [
        'tenant_id',
        'user_id',
        'appointment_id',
        'kind',
        'url',
        'caption',
        'taken_at',
    ];

    protected function casts(): array
    {
        return [
            'taken_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function appointment(): BelongsTo
    {
        return $this->belongsTo(Appointment::class);
    }
}
