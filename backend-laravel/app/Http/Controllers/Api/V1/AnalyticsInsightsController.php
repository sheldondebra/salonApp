<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\V1\Concerns\ResolvesTenantFromRequest;
use App\Http\Controllers\Controller;
use App\Services\AnalyticsInsightsService;
use App\Support\ReportFilters;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AnalyticsInsightsController extends Controller
{
    use ResolvesTenantFromRequest;

    public function __construct(
        private readonly AnalyticsInsightsService $insights,
    ) {}

    public function __invoke(Request $request, string $tenantSlug): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);
        $filters = ReportFilters::fromRequest($request, $tenant->id);

        return response()->json([
            'data' => $this->insights->dashboard($tenant->id, $filters),
        ]);
    }

    public function occupancy(Request $request, string $tenantSlug): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);
        $filters = ReportFilters::fromRequest($request, $tenant->id);

        return response()->json($this->insights->occupancyDashboard($tenant->id, $filters));
    }

    public function retention(Request $request, string $tenantSlug): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);
        $filters = ReportFilters::fromRequest($request, $tenant->id);

        return response()->json($this->insights->retentionDashboard($tenant->id, $filters));
    }
}
