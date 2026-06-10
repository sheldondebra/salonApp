<?php

namespace App\Models;

use App\Enums\ApprovalRequestStatus;
use App\Models\Concerns\BelongsToTenant;
use App\Models\Concerns\FixesPgsqlBooleans;
use App\Models\Concerns\HasUuidRouteKey;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ApprovalRequest extends Model
{
    use BelongsToTenant, FixesPgsqlBooleans, HasUuidRouteKey;

    protected $fillable = [
        'tenant_id',
        'uuid',
        'type',
        'status',
        'title',
        'description',
        'payload',
        'requested_by_user_id',
        'reviewed_by_user_id',
        'review_note',
        'reviewed_at',
        'is_urgent',
    ];

    protected function casts(): array
    {
        return [
            'status' => ApprovalRequestStatus::class,
            'payload' => 'array',
            'reviewed_at' => 'datetime',
            'is_urgent' => 'boolean',
        ];
    }

    public function requestedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by_user_id');
    }

    public function reviewedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by_user_id');
    }
}
