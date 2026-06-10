<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\V1\Concerns\ResolvesTenantFromRequest;
use App\Http\Controllers\Controller;
use App\Models\StoreOrder;
use App\Services\StoreOrderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StoreOrderController extends Controller
{
    use ResolvesTenantFromRequest;

    public function __construct(
        private readonly StoreOrderService $store,
    ) {}

    public function index(Request $request, string $tenantSlug): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);
        $filters = $request->validate([
            'status' => ['nullable', 'string', 'max:32'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        $paginator = $this->store->paginateOrders($tenant->id, $filters, (int) ($filters['per_page'] ?? 20));

        return response()->json([
            'data' => collect($paginator->items())->map(fn (StoreOrder $order) => $this->store->formatOrder($order)),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }

    public function show(Request $request, string $tenantSlug, StoreOrder $storeOrder): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);
        abort_unless($storeOrder->tenant_id === $tenant->id, 404);

        return response()->json(['data' => $this->store->formatOrder($storeOrder)]);
    }
}
