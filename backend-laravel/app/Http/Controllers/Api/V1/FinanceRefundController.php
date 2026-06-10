<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\FinanceRefundMethod;
use App\Enums\FinanceRefundSource;
use App\Http\Controllers\Api\V1\Concerns\ResolvesTenantFromRequest;
use App\Http\Controllers\Controller;
use App\Models\TenantFinanceRefund;
use App\Services\TenantFinanceRefundService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class FinanceRefundController extends Controller
{
    use ResolvesTenantFromRequest;

    public function __construct(
        private readonly TenantFinanceRefundService $refunds,
    ) {}

    public function index(Request $request, string $tenantSlug): JsonResponse
    {
        $this->authorize('viewFinance');
        $tenant = $this->tenant($request, $tenantSlug);

        $filters = $request->validate([
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date', 'after_or_equal:from'],
            'status' => ['nullable', 'string', 'max:32'],
            'source_type' => ['nullable', Rule::in(FinanceRefundSource::values())],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $paginator = $this->refunds->paginate(
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

    public function show(Request $request, string $tenantSlug, TenantFinanceRefund $refund): JsonResponse
    {
        $this->authorize('viewFinance');
        $tenant = $this->tenant($request, $tenantSlug);
        abort_unless($refund->tenant_id === $tenant->id, 404);

        return response()->json([
            'data' => $this->refunds->formatRefund($this->refunds->find($tenant->id, $refund->id)),
        ]);
    }

    public function preview(Request $request, string $tenantSlug): JsonResponse
    {
        $this->authorize('viewFinance');
        $tenant = $this->tenant($request, $tenantSlug);

        $data = $request->validate([
            'source_type' => ['required', Rule::in(FinanceRefundSource::values())],
            'source_id' => ['required', 'integer', 'min:1'],
        ]);

        return response()->json([
            'data' => $this->refunds->refundableSummary(
                $tenant->id,
                $data['source_type'],
                (int) $data['source_id'],
            ),
        ]);
    }

    public function store(Request $request, string $tenantSlug): JsonResponse
    {
        $this->authorize('refundFinance');
        $tenant = $this->tenant($request, $tenantSlug);

        $data = $request->validate([
            'source_type' => ['required', Rule::in(FinanceRefundSource::values())],
            'source_id' => ['required', 'integer', 'min:1'],
            'amount_cents' => ['required', 'integer', 'min:1'],
            'refund_method' => ['nullable', Rule::in(FinanceRefundMethod::values())],
            'reason' => ['required', 'string', 'max:64'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'gateway_reference' => ['nullable', 'string', 'max:128'],
        ]);

        $refund = $this->refunds->create($tenant->id, $data, $request->user());

        return response()->json(['data' => $refund], 201);
    }
}
