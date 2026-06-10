<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\BranchComparisonService;
use App\Support\ReportFilters;
use App\Support\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BranchComparisonController extends Controller
{
    public function __construct(
        private readonly BranchComparisonService $branches,
    ) {}

    public function show(Request $request): JsonResponse
    {
        $this->authorize('viewAny', \App\Models\Location::class);

        $filters = ReportFilters::fromRequest($request, TenantContext::id());

        return response()->json($this->branches->compare($filters));
    }
}
