<?php

namespace App\Models;

use App\Enums\ReviewStatus;
use App\Models\Concerns\BelongsToTenant;
use App\Models\Concerns\FixesPgsqlBooleans;
use App\Models\Concerns\HasUuidRouteKey;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Review extends Model
{
    use BelongsToTenant, FixesPgsqlBooleans, HasUuidRouteKey;

    protected $fillable = [
        'tenant_id',
        'uuid',
        'review_request_id',
        'appointment_id',
        'client_user_id',
        'staff_member_id',
        'service_id',
        'rating',
        'comment',
        'status',
        'is_verified',
        'source',
    ];

    protected function casts(): array
    {
        return [
            'status' => ReviewStatus::class,
            'is_verified' => 'boolean',
        ];
    }

    public function request(): BelongsTo
    {
        return $this->belongsTo(ReviewRequest::class, 'review_request_id');
    }

    public function appointment(): BelongsTo
    {
        return $this->belongsTo(Appointment::class);
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(User::class, 'client_user_id');
    }

    public function staffMember(): BelongsTo
    {
        return $this->belongsTo(StaffMember::class);
    }

    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }

    public function complaintCase(): HasOne
    {
        return $this->hasOne(ComplaintCase::class);
    }
}
