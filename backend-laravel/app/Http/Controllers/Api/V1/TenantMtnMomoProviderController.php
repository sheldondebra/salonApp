<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Services\PaymentProviderAccountService;
use App\Services\TenantPaymentSettingService;
use App\Enums\TenantPaymentMode;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TenantMtnMomoProviderController extends Controller
{
    public function __construct(
        protected PaymentProviderAccountService $providers,
        protected TenantPaymentSettingService $paymentSettings,
    ) {}

    public function show(Request $request, string $tenantSlug): JsonResponse
    {
        $tenant = $this->resolveTenant($request, $tenantSlug);
        $mode = $this->paymentSettings->forTenant($tenant)->mode;

        $platform = $this->providers->payload($this->providers->platformAccount());
        $tenantAccount = null;
        $canManageOwn = $mode === TenantPaymentMode::TenantOwnAccount;

        if ($canManageOwn) {
            $tenantAccount = $this->providers->payload($this->providers->tenantAccount($tenant));
        }

        return response()->json([
            'data' => [
                'payment_mode' => $mode->value,
                'uses_platform_account' => $mode === TenantPaymentMode::PlatformAccount,
                'can_manage_own_account' => $canManageOwn,
                'platform_account' => $platform,
                'tenant_account' => $tenantAccount,
            ],
        ]);
    }

    public function requestConnection(Request $request, string $tenantSlug): JsonResponse
    {
        $tenant = $this->resolveTenant($request, $tenantSlug);
        $account = $this->providers->requestTenantConnection($tenant);

        return response()->json([
            'data' => $this->providers->payload($account),
            'message' => 'MTN MoMo connection request recorded. Add your merchant credentials to continue.',
        ], 201);
    }

    public function update(Request $request, string $tenantSlug): JsonResponse
    {
        $tenant = $this->resolveTenant($request, $tenantSlug);
        $this->providers->assertTenantOwnGatewayAllowed($tenant);

        $validated = $request->validate([
            'environment' => ['sometimes', 'in:sandbox,production'],
            'country' => ['sometimes', 'string', 'max:8'],
            'currency' => ['sometimes', 'string', 'size:3'],
            'api_user' => ['nullable', 'string', 'max:255'],
            'api_key' => ['nullable', 'string', 'max:255'],
            'subscription_key' => ['nullable', 'string', 'max:255'],
            'target_environment' => ['nullable', 'string', 'max:64'],
            'callback_host' => ['nullable', 'string', 'max:255'],
        ]);

        $account = $this->providers->updateAccount(
            $this->providers->tenantAccount($tenant),
            $validated
        );

        return response()->json([
            'data' => $this->providers->payload($account),
            'message' => 'Tenant MTN MoMo settings saved.',
        ]);
    }

    public function healthCheck(Request $request, string $tenantSlug): JsonResponse
    {
        $tenant = $this->resolveTenant($request, $tenantSlug);
        $this->providers->assertTenantOwnGatewayAllowed($tenant);

        $result = $this->providers->healthCheck($this->providers->tenantAccount($tenant));

        return response()->json($result, $result['ok'] ? 200 : 422);
    }

    protected function resolveTenant(Request $request, string $tenantSlug): Tenant
    {
        /** @var Tenant $tenant */
        $tenant = $request->attributes->get('tenant');

        if ($tenant->slug !== $tenantSlug) {
            abort(404);
        }

        return $tenant;
    }
}
