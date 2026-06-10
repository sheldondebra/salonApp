<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class TenantExpense extends Model
{
    use BelongsToTenant;
    use SoftDeletes;

    protected $fillable = [
        'tenant_id',
        'branch_id',
        'expense_category_id',
        'created_by_user_id',
        'vendor_name',
        'amount_cents',
        'tax_amount_cents',
        'currency',
        'payment_method',
        'expense_date',
        'receipt_path',
        'note',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'expense_date' => 'date',
        ];
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(ExpenseCategory::class, 'expense_category_id');
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Location::class, 'branch_id');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }
}
