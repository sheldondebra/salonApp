<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Services\ReportsService;
use App\Support\ReportFilters;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminReportsController extends Controller
{
    public function __construct(
        protected ReportsService $reports,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Tenant::class);

        $filters = ReportFilters::fromRequest($request);

        return response()->json($this->reports->adminReport($filters));
    }
}
