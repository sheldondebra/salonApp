<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\FinanceAdjustmentDirection;
use App\Http\Controllers\Api\V1\Concerns\ResolvesTenantFromRequest;
use App\Http\Controllers\Controller;
use App\Services\TenantFinanceAdjustmentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class FinanceAdjustmentController extends Controller
{
    use ResolvesTenantFromRequest;

    public function __construct(
        private readonly TenantFinanceAdjustmentService $adjustments,
    ) {}

    public function index(Request $request, string $tenantSlug): JsonResponse
    {
        $this->authorize('viewFinance');
        $tenant = $this->tenant($request, $tenantSlug);

        $filters = $request->validate([
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date', 'after_or_equal:from'],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $paginator = $this->adjustments->paginate(
            $tenant->id,
            $filters,
            (int) ($filters['per_page'] ?? 20),
        );

        return response()->json([
            'data' => $paginator->items(),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }

    public function store(Request $request, string $tenantSlug): JsonResponse
    {
        $this->authorize('adjustFinance');
        $tenant = $this->tenant($request, $tenantSlug);

        $data = $request->validate([
            'ledger_reference' => ['required', 'string', 'max:128'],
            'source_type' => ['nullable', 'string', 'max:32'],
            'source_id' => ['nullable', 'integer', 'min:1'],
            'direction' => ['required', Rule::in(FinanceAdjustmentDirection::values())],
            'amount_cents' => ['required', 'integer', 'min:1'],
            'currency' => ['nullable', 'string', 'size:3'],
            'reason' => ['required', 'string', 'max:128'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $adjustment = $this->adjustments->create($tenant->id, $data, $request->user());

        return response()->json(['data' => $adjustment], 201);
    }
}
