<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\TenantPaymentSettings\UpdateTenantPaymentSettingRequest;
use App\Http\Resources\TenantPaymentSettingResource;
use App\Models\Tenant;
use App\Models\TenantPaymentSetting;
use App\Services\TenantPaymentSettingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TenantPaymentSettingController extends Controller
{
    public function show(Request $request, TenantPaymentSettingService $service): JsonResponse
    {
        $this->authorize('view', TenantPaymentSetting::class);

        $tenant = $this->resolveTenant($request);
        $setting = $service->forTenant($tenant);

        return response()->json([
            'data' => new TenantPaymentSettingResource($setting),
        ]);
    }

    public function update(
        UpdateTenantPaymentSettingRequest $request,
        TenantPaymentSettingService $service
    ): JsonResponse {
        $this->authorize('update', TenantPaymentSetting::class);

        $tenant = $this->resolveTenant($request);
        $setting = $service->update($tenant, $request->validated(), $request->user());

        return response()->json([
            'data' => new TenantPaymentSettingResource($setting),
            'message' => 'Payment settings saved',
        ]);
    }

    protected function resolveTenant(Request $request): Tenant
    {
        /** @var Tenant $tenant */
        $tenant = $request->attributes->get('tenant');

        return $tenant;
    }
}
