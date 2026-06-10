<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\V1\Concerns\ResolvesTenantFromRequest;
use App\Http\Controllers\Controller;
use App\Services\FinanceTipsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FinanceTipsController extends Controller
{
    use ResolvesTenantFromRequest;

    public function __construct(
        private readonly FinanceTipsService $tips,
    ) {}

    public function index(Request $request, string $tenantSlug): JsonResponse
    {
        $this->authorize('viewFinance');
        $tenant = $this->tenant($request, $tenantSlug);

        $filters = $request->validate([
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date', 'after_or_equal:from'],
            'location_id' => ['nullable', 'integer'],
            'q' => ['nullable', 'string', 'max:100'],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $paginator = $this->tips->paginate(
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
                'summary' => $this->tips->summary($tenant->id, $filters),
                'monthly_trend' => $this->tips->monthlyTrend($tenant->id),
            ],
        ]);
    }
}
