<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SmsPurchaseInvoice extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'sms_package_id',
        'credits',
        'amount_cents',
        'currency',
        'status',
        'payment_gateway',
        'provider_reference',
        'paid_at',
        'meta',
    ];

    protected function casts(): array
    {
        return [
            'paid_at' => 'datetime',
            'meta' => 'array',
        ];
    }

    public function package(): BelongsTo
    {
        return $this->belongsTo(SmsPackage::class, 'sms_package_id');
    }
}
