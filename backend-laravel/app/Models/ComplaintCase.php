<?php

namespace App\Models;

use App\Enums\ComplaintCaseStatus;
use App\Models\Concerns\BelongsToTenant;
use App\Models\Concerns\HasUuidRouteKey;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ComplaintCase extends Model
{
    use BelongsToTenant, HasUuidRouteKey;

    protected $fillable = [
        'tenant_id',
        'uuid',
        'review_id',
        'status',
        'assigned_user_id',
        'internal_notes',
        'resolution_note',
        'resolved_at',
    ];

    protected function casts(): array
    {
        return [
            'status' => ComplaintCaseStatus::class,
            'resolved_at' => 'datetime',
        ];
    }

    public function review(): BelongsTo
    {
        return $this->belongsTo(Review::class);
    }

    public function assignedUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_user_id');
    }
}
