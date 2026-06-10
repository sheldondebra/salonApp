<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\V1\Concerns\ResolvesTenantFromRequest;
use App\Http\Controllers\Controller;
use App\Services\PosDiscountPolicyService;
use App\Support\PermissionChecker;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FinanceDiscountPolicyController extends Controller
{
    use ResolvesTenantFromRequest;

    public function __construct(
        private readonly PosDiscountPolicyService $policy,
    ) {}

    public function show(Request $request, string $tenantSlug): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);
        $user = $request->user();

        return response()->json([
            'data' => [
                'threshold_percent' => $this->policy->thresholdPercent($tenant),
                'can_apply_discount' => PermissionChecker::allows($user, 'finance.apply_discount'),
                'can_approve_discount' => PermissionChecker::allows($user, 'finance.approve_discount'),
            ],
        ]);
    }
}
