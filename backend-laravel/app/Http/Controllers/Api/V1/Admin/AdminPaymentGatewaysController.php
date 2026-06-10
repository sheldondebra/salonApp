<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Services\PlatformPaymentGatewaysService;
use Illuminate\Http\JsonResponse;

class AdminPaymentGatewaysController extends Controller
{
    public function __construct(
        protected PlatformPaymentGatewaysService $gateways,
    ) {}

    public function overview(): JsonResponse
    {
        return response()->json($this->gateways->overview());
    }
}
