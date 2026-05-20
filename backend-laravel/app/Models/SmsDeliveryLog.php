<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SmsDeliveryLog extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'sms_message_id',
        'provider_message_id',
        'recipient',
        'sender_id',
        'message_type',
        'status',
        'credits_charged',
        'provider_response',
    ];

    protected function casts(): array
    {
        return [
            'provider_response' => 'array',
        ];
    }

    public function smsMessage(): BelongsTo
    {
        return $this->belongsTo(SmsMessage::class);
    }
}
