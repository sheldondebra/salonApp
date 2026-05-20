<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SmsSenderIdRequest extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'requested_sender_id',
        'status',
        'tenant_confirmed_at',
        'submitted_at',
        'provider_reference',
        'notes',
        'reviewed_by_user_id',
    ];

    protected function casts(): array
    {
        return [
            'tenant_confirmed_at' => 'datetime',
            'submitted_at' => 'datetime',
        ];
    }

    public function reviewedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by_user_id');
    }
}
