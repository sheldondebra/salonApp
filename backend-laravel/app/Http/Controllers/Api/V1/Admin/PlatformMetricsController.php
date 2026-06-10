<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Services\PlatformMetricsService;
use Illuminate\Http\JsonResponse;

class PlatformMetricsController extends Controller
{
    public function __invoke(PlatformMetricsService $metrics): JsonResponse
    {
        return response()->json([
            'cards' => $metrics->cards(),
            'alerts' => $metrics->alerts($metrics->cards()),
        ]);
    }
}
