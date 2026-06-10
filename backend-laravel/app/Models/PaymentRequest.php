<?php

namespace App\Models;

use App\Enums\PaymentRequestReason;
use App\Enums\PaymentRequestStatus;
use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class PaymentRequest extends Model
{
    use BelongsToTenant;
    use SoftDeletes;

    protected $fillable = [
        'tenant_id',
        'branch_id',
        'customer_id',
        'booking_id',
        'invoice_id',
        'pos_sale_id',
        'sms_purchase_invoice_id',
        'requested_by_user_id',
        'amount_cents',
        'currency',
        'phone',
        'email',
        'gateway',
        'payment_channel',
        'reason',
        'description',
        'reference',
        'external_reference',
        'transaction_uuid',
        'status',
        'provider_status',
        'provider_response',
        'failed_reason',
        'expires_at',
        'paid_at',
        'callback_received_at',
        'status_checked_at',
        'cancelled_at',
    ];

    protected function casts(): array
    {
        return [
            'status' => PaymentRequestStatus::class,
            'reason' => PaymentRequestReason::class,
            'provider_response' => 'array',
            'expires_at' => 'datetime',
            'paid_at' => 'datetime',
            'callback_received_at' => 'datetime',
            'status_checked_at' => 'datetime',
            'cancelled_at' => 'datetime',
        ];
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Location::class, 'branch_id');
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'customer_id');
    }

    public function booking(): BelongsTo
    {
        return $this->belongsTo(Appointment::class, 'booking_id');
    }

    public function posSale(): BelongsTo
    {
        return $this->belongsTo(Sale::class, 'pos_sale_id');
    }

    public function tenantInvoice(): BelongsTo
    {
        return $this->belongsTo(TenantInvoice::class, 'invoice_id');
    }

    public function smsPurchaseInvoice(): BelongsTo
    {
        return $this->belongsTo(SmsPurchaseInvoice::class, 'sms_purchase_invoice_id');
    }

    public function requestedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by_user_id');
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }
}
