<?php

namespace App\Models;

use App\Enums\FinanceRefundMethod;
use App\Enums\FinanceRefundSource;
use App\Enums\FinanceRefundStatus;
use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TenantFinanceRefund extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'branch_id',
        'source_type',
        'source_id',
        'sale_id',
        'payment_request_id',
        'tenant_invoice_id',
        'amount_cents',
        'currency',
        'refund_method',
        'reason',
        'status',
        'gateway_reference',
        'notes',
        'refunded_by_user_id',
        'refunded_at',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'source_type' => FinanceRefundSource::class,
            'refund_method' => FinanceRefundMethod::class,
            'status' => FinanceRefundStatus::class,
            'refunded_at' => 'datetime',
            'metadata' => 'array',
        ];
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Location::class, 'branch_id');
    }

    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }

    public function paymentRequest(): BelongsTo
    {
        return $this->belongsTo(PaymentRequest::class);
    }

    public function tenantInvoice(): BelongsTo
    {
        return $this->belongsTo(TenantInvoice::class);
    }

    public function refundedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'refunded_by_user_id');
    }
}
