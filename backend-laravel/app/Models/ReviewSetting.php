<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use App\Models\Concerns\FixesPgsqlBooleans;
use App\Models\Concerns\HasUuidRouteKey;
use Illuminate\Database\Eloquent\Model;

class ReviewSetting extends Model
{
    use BelongsToTenant, FixesPgsqlBooleans, HasUuidRouteKey;

    protected $fillable = [
        'tenant_id',
        'uuid',
        'auto_send_after_appointment',
        'delay_hours',
        'request_message_template',
        'google_review_url',
        'auto_send_google_review',
        'low_rating_threshold',
    ];

    protected function casts(): array
    {
        return [
            'auto_send_after_appointment' => 'boolean',
            'auto_send_google_review' => 'boolean',
        ];
    }
}
