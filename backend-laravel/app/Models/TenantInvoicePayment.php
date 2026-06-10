<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TenantInvoicePayment extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'tenant_invoice_id',
        'payment_method',
        'amount_cents',
        'reference',
        'payment_request_id',
        'recorded_by_user_id',
        'paid_at',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'paid_at' => 'datetime',
        ];
    }

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(TenantInvoice::class, 'tenant_invoice_id');
    }

    public function paymentRequest(): BelongsTo
    {
        return $this->belongsTo(PaymentRequest::class);
    }

    public function recordedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recorded_by_user_id');
    }
}
