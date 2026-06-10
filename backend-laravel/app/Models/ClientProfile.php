<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ClientProfile extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'user_id',
        'preferred_staff_member_id',
        'preferred_contact',
        'sms_reminders',
        'email_marketing',
        'sms_marketing',
        'tags',
    ];

    protected function casts(): array
    {
        return [
            'sms_reminders' => 'boolean',
            'email_marketing' => 'boolean',
            'sms_marketing' => 'boolean',
            'tags' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function preferredStaffMember(): BelongsTo
    {
        return $this->belongsTo(StaffMember::class, 'preferred_staff_member_id');
    }
}
