<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use App\Models\Concerns\FixesPgsqlBooleans;
use App\Models\Concerns\HasUuidRouteKey;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class ReviewRequest extends Model
{
    use BelongsToTenant, FixesPgsqlBooleans, HasUuidRouteKey;

    protected $fillable = [
        'tenant_id',
        'uuid',
        'appointment_id',
        'client_user_id',
        'client_email',
        'status',
        'sent_at',
        'completed_at',
        'token',
        'google_review_sent',
    ];

    protected function casts(): array
    {
        return [
            'sent_at' => 'datetime',
            'completed_at' => 'datetime',
            'google_review_sent' => 'boolean',
        ];
    }

    public function appointment(): BelongsTo
    {
        return $this->belongsTo(Appointment::class);
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(User::class, 'client_user_id');
    }

    public function review(): HasOne
    {
        return $this->hasOne(Review::class);
    }
}
