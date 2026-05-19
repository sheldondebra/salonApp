<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class BillingInvoice extends Model
{
    protected $fillable = [
        'uuid',
        'invoice_number',
        'user_id',
        'platform_subscription_id',
        'amount_cents',
        'currency',
        'status',
        'line_items',
        'sent_at',
        'paid_at',
    ];

    protected function casts(): array
    {
        return [
            'line_items' => 'array',
            'sent_at' => 'datetime',
            'paid_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (BillingInvoice $invoice) {
            $invoice->uuid ??= (string) Str::uuid();
            $invoice->invoice_number ??= 'INV-'.strtoupper(Str::random(10));
        });
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function subscription(): BelongsTo
    {
        return $this->belongsTo(PlatformSubscription::class, 'platform_subscription_id');
    }
}
