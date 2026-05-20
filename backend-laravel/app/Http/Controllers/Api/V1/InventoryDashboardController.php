<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\StockMovementResource;
use App\Models\StockMovement;
use App\Services\InventoryService;
use App\Support\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InventoryDashboardController extends Controller
{
    public function __construct(
        protected InventoryService $inventory,
    ) {}

    public function show(Request $request): JsonResponse
    {
        $this->authorize('viewAny', \App\Models\Product::class);

        $tenantId = TenantContext::id();
        $locationId = $request->filled('location_id') ? $request->integer('location_id') : null;

        $movements = StockMovement::query()
            ->with(['product', 'location', 'user'])
            ->orderByDesc('created_at')
            ->limit(8)
            ->get();

        return response()->json([
            'summary' => $this->inventory->dashboardSummary($tenantId, $locationId),
            'low_stock' => $this->inventory->lowStockProducts($tenantId, $locationId, 12),
            'recent_movements' => StockMovementResource::collection($movements),
        ]);
    }
}
