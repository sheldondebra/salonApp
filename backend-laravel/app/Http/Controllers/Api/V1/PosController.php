<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Sale;
use App\Services\InventoryService;
use App\Support\TenantContext;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PosController extends Controller
{
    public function __construct(
        protected InventoryService $inventory,
    ) {}

    public function summary(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Sale::class);

        $tenantId = TenantContext::id();
        $today = Carbon::today();
        $startOfMonth = Carbon::now()->startOfMonth();
        $locationId = $request->filled('location_id') ? $request->integer('location_id') : null;

        $base = Sale::query()
            ->where('tenant_id', $tenantId)
            ->where('status', 'completed');

        $todaySales = (clone $base)->whereDate('completed_at', $today);

        return response()->json([
            'sales_today_count' => (clone $todaySales)->count(),
            'sales_today_cents' => (int) (clone $todaySales)->sum('total_cents'),
            'sales_month_count' => (clone $base)->where('completed_at', '>=', $startOfMonth)->count(),
            'sales_month_cents' => (int) (clone $base)->where('completed_at', '>=', $startOfMonth)->sum('total_cents'),
            'inventory' => $this->inventory->dashboardSummary($tenantId, $locationId),
        ]);
    }
}
