<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\FinanceOverviewService;
use App\Support\ReportFilters;
use App\Support\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FinanceOverviewController extends Controller
{
    public function __construct(
        private readonly FinanceOverviewService $finance,
    ) {}

    public function show(Request $request): JsonResponse
    {
        $this->authorize('viewFinance');

        $filters = ReportFilters::fromRequest($request, TenantContext::id());

        return response()->json($this->finance->overview($filters));
    }
}
