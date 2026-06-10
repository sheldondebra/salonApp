<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Services\PlatformMetricsService;
use Illuminate\Http\JsonResponse;

class AdminDashboardController extends Controller
{
    public function __construct(
        protected PlatformMetricsService $metrics,
    ) {}

    public function __invoke(): JsonResponse
    {
        return response()->json($this->metrics->overview());
    }

    public function overview(): JsonResponse
    {
        return response()->json($this->metrics->overview());
    }
}
