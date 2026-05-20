<?php

namespace App\Models;

use App\Enums\SmsWalletTransactionType;
use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SmsWalletTransaction extends Model
{
    use BelongsToTenant;

    public $timestamps = false;

    protected $fillable = [
        'tenant_id',
        'type',
        'amount',
        'balance_after',
        'reference_type',
        'reference_id',
        'sms_message_id',
        'performed_by_user_id',
        'notes',
        'meta',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'type' => SmsWalletTransactionType::class,
            'meta' => 'array',
            'created_at' => 'datetime',
        ];
    }

    public function performedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'performed_by_user_id');
    }

    public function smsMessage(): BelongsTo
    {
        return $this->belongsTo(SmsMessage::class);
    }
}
