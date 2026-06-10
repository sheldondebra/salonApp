<?php

namespace App\Services;

use App\Models\ExpenseCategory;
use App\Models\TenantExpense;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

class TenantExpenseService
{
    /** @var list<array{name: string, slug: string}> */
    private const DEFAULT_CATEGORIES = [
        ['name' => 'Rent', 'slug' => 'rent'],
        ['name' => 'Salaries', 'slug' => 'salaries'],
        ['name' => 'Product supplies', 'slug' => 'product-supplies'],
        ['name' => 'Utilities', 'slug' => 'utilities'],
        ['name' => 'Marketing', 'slug' => 'marketing'],
        ['name' => 'Equipment', 'slug' => 'equipment'],
        ['name' => 'Repairs', 'slug' => 'repairs'],
        ['name' => 'Internet', 'slug' => 'internet'],
        ['name' => 'Transport', 'slug' => 'transport'],
        ['name' => 'Training', 'slug' => 'training'],
        ['name' => 'Software', 'slug' => 'software'],
        ['name' => 'Other', 'slug' => 'other'],
    ];

    /** @return list<ExpenseCategory> */
    public function categories(int $tenantId): array
    {
        $this->ensureDefaultCategories($tenantId);

        return ExpenseCategory::query()
            ->where('tenant_id', $tenantId)
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get()
            ->all();
    }

    /** @param  array<string, mixed>  $filters */
    public function paginate(int $tenantId, array $filters = [], int $perPage = 20): LengthAwarePaginator
    {
        $this->ensureDefaultCategories($tenantId);

        $query = $this->baseQuery($tenantId)
            ->with(['category:id,name,slug', 'branch:id,name', 'createdBy:id,name']);

        $this->applyFilters($query, $filters);

        return $query
            ->orderByDesc('expense_date')
            ->orderByDesc('id')
            ->paginate(min(max($perPage, 1), 100));
    }

    public function find(int $tenantId, int $expenseId): TenantExpense
    {
        return $this->baseQuery($tenantId)
            ->with(['category', 'branch:id,name', 'createdBy:id,name'])
            ->findOrFail($expenseId);
    }

    /** @param  array<string, mixed>  $data */
    public function create(int $tenantId, array $data, User $user): TenantExpense
    {
        $this->ensureDefaultCategories($tenantId);

        return DB::transaction(function () use ($tenantId, $data, $user) {
            ExpenseCategory::query()
                ->where('tenant_id', $tenantId)
                ->findOrFail((int) $data['expense_category_id']);

            $expense = TenantExpense::query()->create([
                'tenant_id' => $tenantId,
                'branch_id' => $data['branch_id'] ?? null,
                'expense_category_id' => (int) $data['expense_category_id'],
                'created_by_user_id' => $user->id,
                'vendor_name' => $data['vendor_name'] ?? null,
                'amount_cents' => (int) $data['amount_cents'],
                'tax_amount_cents' => (int) ($data['tax_amount_cents'] ?? 0),
                'currency' => $data['currency'] ?? 'GHS',
                'payment_method' => $data['payment_method'] ?? 'cash',
                'expense_date' => $data['expense_date'] ?? now()->toDateString(),
                'receipt_path' => $data['receipt_path'] ?? null,
                'note' => $data['note'] ?? null,
                'status' => 'posted',
            ]);

            return $this->find($tenantId, $expense->id);
        });
    }

    public function void(int $tenantId, TenantExpense $expense): TenantExpense
    {
        abort_unless($expense->tenant_id === $tenantId, 404);

        $expense->update(['status' => 'void']);

        return $this->find($tenantId, $expense->id);
    }

    public function sumInRange(int $tenantId, ?Carbon $from = null, ?Carbon $to = null, ?int $branchId = null): int
    {
        $query = TenantExpense::query()
            ->where('tenant_id', $tenantId)
            ->where('status', 'posted');

        if ($from) {
            $query->whereDate('expense_date', '>=', $from->toDateString());
        }
        if ($to) {
            $query->whereDate('expense_date', '<=', $to->toDateString());
        }
        if ($branchId) {
            $query->where('branch_id', $branchId);
        }

        return (int) $query->sum('amount_cents');
    }

    /** @param  array<string, mixed>  $filters */
    /** @return array<string, mixed> */
    public function summary(int $tenantId, array $filters = []): array
    {
        $query = $this->baseQuery($tenantId)->where('status', 'posted');
        $this->applyFilters($query, $filters);

        $rows = (clone $query)->get();

        return [
            'total_count' => $rows->count(),
            'total_cents' => (int) $rows->sum('amount_cents'),
            'this_month_cents' => (int) TenantExpense::query()
                ->where('tenant_id', $tenantId)
                ->where('status', 'posted')
                ->whereYear('expense_date', now()->year)
                ->whereMonth('expense_date', now()->month)
                ->sum('amount_cents'),
        ];
    }

    /** @return list<array{month: string, label: string, amount_cents: int}> */
    public function monthlyTrend(int $tenantId, int $months = 6): array
    {
        $start = now()->startOfMonth()->subMonths($months - 1);

        $rows = TenantExpense::query()
            ->where('tenant_id', $tenantId)
            ->where('status', 'posted')
            ->whereDate('expense_date', '>=', $start->toDateString())
            ->get()
            ->groupBy(fn (TenantExpense $e) => $e->expense_date->format('Y-m'))
            ->map(fn ($group) => (int) $group->sum('amount_cents'));

        $points = [];
        for ($i = 0; $i < $months; $i++) {
            $date = $start->copy()->addMonths($i);
            $key = $date->format('Y-m');
            $points[] = [
                'month' => $key,
                'label' => $date->format('M Y'),
                'amount_cents' => (int) ($rows[$key] ?? 0),
            ];
        }

        return $points;
    }

    /** @return list<array{vendor_name: string, amount_cents: int, count: int}> */
    public function vendorSummary(int $tenantId, array $filters = [], int $limit = 8): array
    {
        $query = $this->baseQuery($tenantId)->where('status', 'posted');
        $this->applyFilters($query, $filters);

        return $query
            ->selectRaw("COALESCE(NULLIF(vendor_name, ''), 'Unknown vendor') as vendor_label, SUM(amount_cents) as total, COUNT(*) as cnt")
            ->groupBy('vendor_label')
            ->orderByDesc('total')
            ->limit($limit)
            ->get()
            ->map(fn ($row) => [
                'vendor_name' => (string) $row->vendor_label,
                'amount_cents' => (int) $row->total,
                'count' => (int) $row->cnt,
            ])
            ->values()
            ->all();
    }

    /** @return array<string, mixed> */
    public function formatExpense(TenantExpense $expense): array
    {
        return [
            'id' => $expense->id,
            'vendor_name' => $expense->vendor_name,
            'amount_cents' => (int) $expense->amount_cents,
            'tax_amount_cents' => (int) $expense->tax_amount_cents,
            'currency' => $expense->currency,
            'payment_method' => $expense->payment_method,
            'expense_date' => $expense->expense_date?->toDateString(),
            'receipt_path' => $expense->receipt_path,
            'note' => $expense->note,
            'status' => $expense->status,
            'created_at' => $expense->created_at?->toIso8601String(),
            'category' => $expense->category ? [
                'id' => $expense->category->id,
                'name' => $expense->category->name,
                'slug' => $expense->category->slug,
            ] : null,
            'branch' => $expense->branch ? ['id' => $expense->branch->id, 'name' => $expense->branch->name] : null,
            'created_by' => $expense->createdBy ? ['id' => $expense->createdBy->id, 'name' => $expense->createdBy->name] : null,
        ];
    }

    private function ensureDefaultCategories(int $tenantId): void
    {
        if (ExpenseCategory::query()->where('tenant_id', $tenantId)->exists()) {
            return;
        }

        foreach (self::DEFAULT_CATEGORIES as $index => $cat) {
            ExpenseCategory::query()->create([
                'tenant_id' => $tenantId,
                'name' => $cat['name'],
                'slug' => $cat['slug'],
                'sort_order' => $index,
                'is_system' => true,
            ]);
        }
    }

    private function baseQuery(int $tenantId): Builder
    {
        return TenantExpense::query()->where('tenant_id', $tenantId);
    }

    /** @param  Builder<TenantExpense>  $query */
    /** @param  array<string, mixed>  $filters */
    private function applyFilters(Builder $query, array $filters): void
    {
        if (! empty($filters['category_id'])) {
            $query->where('expense_category_id', (int) $filters['category_id']);
        }

        if (! empty($filters['from'])) {
            $query->whereDate('expense_date', '>=', Carbon::parse($filters['from'])->toDateString());
        }

        if (! empty($filters['to'])) {
            $query->whereDate('expense_date', '<=', Carbon::parse($filters['to'])->toDateString());
        }

        if (! empty($filters['q'])) {
            $q = trim((string) $filters['q']);
            $query->where(function (Builder $inner) use ($q) {
                $inner->where('vendor_name', 'ilike', "%{$q}%")
                    ->orWhere('note', 'ilike', "%{$q}%")
                    ->orWhereHas('category', fn (Builder $c) => $c->where('name', 'ilike', "%{$q}%"));
            });
        }
    }
}
