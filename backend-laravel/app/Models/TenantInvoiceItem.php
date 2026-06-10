<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TenantInvoiceItem extends Model
{
    protected $fillable = [
        'tenant_invoice_id',
        'description',
        'quantity',
        'unit_price_cents',
        'line_total_cents',
        'sort_order',
    ];

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(TenantInvoice::class, 'tenant_invoice_id');
    }
}
