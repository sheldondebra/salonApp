<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Services\OnboardingService;
use Illuminate\Http\JsonResponse;

class AdminOnboardingController extends Controller
{
    public function __construct(
        protected OnboardingService $onboarding,
    ) {}

    public function index(): JsonResponse
    {
        return response()->json([
            'data' => $this->onboarding->adminOnboardingRows(),
        ]);
    }
}
