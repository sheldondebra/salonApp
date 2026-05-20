<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\ReportsService;
use App\Support\ReportFilters;
use App\Support\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReportsController extends Controller
{
    public function __construct(
        protected ReportsService $reports,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAnalytics');

        $filters = ReportFilters::fromRequest($request, TenantContext::id());

        return response()->json($this->reports->tenantReport($filters));
    }
}
