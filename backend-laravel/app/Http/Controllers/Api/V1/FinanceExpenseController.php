<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\V1\Concerns\ResolvesTenantFromRequest;
use App\Http\Controllers\Controller;
use App\Models\TenantExpense;
use App\Services\TenantExpenseService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FinanceExpenseController extends Controller
{
    use ResolvesTenantFromRequest;

    public function __construct(
        private readonly TenantExpenseService $expenses,
    ) {}

    public function categories(Request $request, string $tenantSlug): JsonResponse
    {
        $this->authorize('viewFinance');
        $tenant = $this->tenant($request, $tenantSlug);

        return response()->json([
            'data' => collect($this->expenses->categories($tenant->id))->map(fn ($cat) => [
                'id' => $cat->id,
                'name' => $cat->name,
                'slug' => $cat->slug,
            ]),
        ]);
    }

    public function index(Request $request, string $tenantSlug): JsonResponse
    {
        $this->authorize('viewFinance');
        $tenant = $this->tenant($request, $tenantSlug);

        $filters = $request->validate([
            'category_id' => ['nullable', 'integer'],
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date', 'after_or_equal:from'],
            'q' => ['nullable', 'string', 'max:100'],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $paginator = $this->expenses->paginate(
            $tenant->id,
            $filters,
            (int) ($filters['per_page'] ?? 20),
        );

        return response()->json([
            'data' => collect($paginator->items())->map(fn (TenantExpense $e) => $this->expenses->formatExpense($e)),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'total' => $paginator->total(),
                'summary' => $this->expenses->summary($tenant->id, $filters),
                'monthly_trend' => $this->expenses->monthlyTrend($tenant->id),
                'vendors' => $this->expenses->vendorSummary($tenant->id, $filters),
            ],
        ]);
    }

    public function store(Request $request, string $tenantSlug): JsonResponse
    {
        $this->authorize('viewFinance');
        $tenant = $this->tenant($request, $tenantSlug);

        $data = $request->validate([
            'expense_category_id' => ['required', 'integer', 'exists:expense_categories,id'],
            'branch_id' => ['nullable', 'integer', 'exists:locations,id'],
            'vendor_name' => ['nullable', 'string', 'max:255'],
            'amount_cents' => ['required', 'integer', 'min:1'],
            'tax_amount_cents' => ['nullable', 'integer', 'min:0'],
            'currency' => ['nullable', 'string', 'size:3'],
            'payment_method' => ['nullable', 'string', 'max:32'],
            'expense_date' => ['nullable', 'date'],
            'receipt_path' => ['nullable', 'string', 'max:500'],
            'note' => ['nullable', 'string', 'max:2000'],
        ]);

        $expense = $this->expenses->create($tenant->id, $data, $request->user());

        return response()->json(['data' => $this->expenses->formatExpense($expense)], 201);
    }

    public function show(Request $request, string $tenantSlug, TenantExpense $expense): JsonResponse
    {
        $this->authorize('viewFinance');
        $tenant = $this->tenant($request, $tenantSlug);
        abort_unless($expense->tenant_id === $tenant->id, 404);

        return response()->json([
            'data' => $this->expenses->formatExpense($this->expenses->find($tenant->id, $expense->id)),
        ]);
    }

    public function void(Request $request, string $tenantSlug, TenantExpense $expense): JsonResponse
    {
        $this->authorize('viewFinance');
        $tenant = $this->tenant($request, $tenantSlug);

        $voided = $this->expenses->void($tenant->id, $expense);

        return response()->json(['data' => $this->expenses->formatExpense($voided)]);
    }
}
