<?php

namespace App\Models;

use App\Enums\InvoiceStatus;
use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class TenantInvoice extends Model
{
    use BelongsToTenant;
    use SoftDeletes;

    protected $fillable = [
        'tenant_id',
        'branch_id',
        'customer_id',
        'booking_id',
        'pos_sale_id',
        'created_by_user_id',
        'invoice_number',
        'status',
        'subtotal_cents',
        'discount_total_cents',
        'tax_total_cents',
        'total_cents',
        'amount_paid_cents',
        'balance_due_cents',
        'currency',
        'due_date',
        'notes',
        'terms',
        'sent_at',
        'paid_at',
        'cancelled_at',
    ];

    protected function casts(): array
    {
        return [
            'status' => InvoiceStatus::class,
            'due_date' => 'date',
            'sent_at' => 'datetime',
            'paid_at' => 'datetime',
            'cancelled_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (TenantInvoice $invoice) {
            $invoice->uuid ??= (string) Str::uuid();
        });
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

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(TenantInvoiceItem::class)->orderBy('sort_order');
    }

    public function payments(): HasMany
    {
        return $this->hasMany(TenantInvoicePayment::class)->orderByDesc('paid_at');
    }

    public function paymentRequests(): HasMany
    {
        return $this->hasMany(PaymentRequest::class, 'invoice_id');
    }
}
