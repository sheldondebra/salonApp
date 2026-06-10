<?php

namespace App\Models;

use App\Enums\PaymentGateway;
use App\Enums\SettlementMethod;
use App\Enums\SettlementSchedule;
use App\Enums\TenantPaymentMode;
use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TenantPaymentSetting extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'mode',
        'default_gateway',
        'mtn_momo_enabled',
        'paystack_enabled',
        'flutterwave_enabled',
        'settlement_schedule',
        'settlement_method',
        'settlement_account_name',
        'settlement_account_number',
        'settlement_provider',
        'settlement_notes',
        'is_payment_enabled',
        'approved_by_user_id',
        'approved_at',
    ];

    protected function casts(): array
    {
        return [
            'mode' => TenantPaymentMode::class,
            'default_gateway' => PaymentGateway::class,
            'settlement_schedule' => SettlementSchedule::class,
            'settlement_method' => SettlementMethod::class,
            'mtn_momo_enabled' => 'boolean',
            'paystack_enabled' => 'boolean',
            'flutterwave_enabled' => 'boolean',
            'is_payment_enabled' => 'boolean',
            'approved_at' => 'datetime',
        ];
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by_user_id');
    }
}
