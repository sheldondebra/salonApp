<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\V1\Concerns\ResolvesTenantFromRequest;
use App\Http\Controllers\Controller;
use App\Services\FinanceInsightsService;
use App\Support\ReportFilters;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FinanceInsightsController extends Controller
{
    use ResolvesTenantFromRequest;

    public function __construct(
        private readonly FinanceInsightsService $insights,
    ) {}

    public function show(Request $request, string $tenantSlug): JsonResponse
    {
        $this->authorize('viewFinance');
        $tenant = $this->tenant($request, $tenantSlug);
        $filters = ReportFilters::fromRequest($request, $tenant->id);

        return response()->json([
            'data' => $this->insights->dashboard($filters),
        ]);
    }
}
