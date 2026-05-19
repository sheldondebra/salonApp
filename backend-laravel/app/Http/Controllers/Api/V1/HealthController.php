<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Support\TenantContext;
use Illuminate\Http\JsonResponse;

class HealthController extends Controller
{
    public function __invoke(): JsonResponse
    {
        return response()->json([
            'status' => 'ok',
            'service' => 'salonapp-api',
            'version' => 'v1',
            'tenant' => TenantContext::get()?->only(['id', 'uuid', 'slug', 'name']),
        ]);
    }
}
