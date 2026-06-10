<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\V1\Concerns\ResolvesTenantFromRequest;
use App\Http\Controllers\Controller;
use App\Models\CheckoutSession;
use App\Services\CheckoutSessionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use InvalidArgumentException;

class CheckoutSessionController extends Controller
{
    use ResolvesTenantFromRequest;

    public function __construct(
        private readonly CheckoutSessionService $checkoutSessions,
    ) {}

    public function store(Request $request, string $tenantSlug): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);

        $data = $request->validate([
            'location_id' => ['required', 'integer', 'exists:locations,id'],
            'client_user_id' => ['nullable', 'integer', 'exists:users,id'],
            'appointment_uuid' => ['nullable', 'string', 'max:36'],
            'items' => ['nullable', 'array'],
            'items.*.type' => ['required_with:items', 'string', 'in:service,product,addon'],
            'items.*.service_id' => ['nullable', 'integer'],
            'items.*.product_id' => ['nullable', 'integer'],
            'items.*.service_addon_id' => ['nullable', 'integer'],
            'items.*.quantity' => ['required_with:items', 'integer', 'min:1', 'max:999'],
            'coupon_code' => ['nullable', 'string', 'max:50'],
            'tax_cents' => ['nullable', 'integer', 'min:0'],
            'service_charge_cents' => ['nullable', 'integer', 'min:0'],
            'tip_cents' => ['nullable', 'integer', 'min:0'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $session = $this->checkoutSessions->create($tenant, $request->user(), $data);

        return response()->json([
            'data' => $this->checkoutSessions->show($session),
        ], 201);
    }

    public function show(Request $request, string $tenantSlug, CheckoutSession $checkoutSession): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);
        $this->assertTenantSession($tenant->id, $checkoutSession);

        return response()->json([
            'data' => $this->checkoutSessions->show($checkoutSession),
        ]);
    }

    public function update(Request $request, string $tenantSlug, CheckoutSession $checkoutSession): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);
        $this->assertTenantSession($tenant->id, $checkoutSession);

        $data = $request->validate([
            'location_id' => ['sometimes', 'integer', 'exists:locations,id'],
            'client_user_id' => ['nullable', 'integer', 'exists:users,id'],
            'appointment_uuid' => ['nullable', 'string', 'max:36'],
            'items' => ['sometimes', 'array'],
            'items.*.type' => ['required_with:items', 'string', 'in:service,product,addon'],
            'items.*.service_id' => ['nullable', 'integer'],
            'items.*.product_id' => ['nullable', 'integer'],
            'items.*.service_addon_id' => ['nullable', 'integer'],
            'items.*.quantity' => ['required_with:items', 'integer', 'min:1', 'max:999'],
            'coupon_code' => ['nullable', 'string', 'max:50'],
            'tax_cents' => ['nullable', 'integer', 'min:0'],
            'service_charge_cents' => ['nullable', 'integer', 'min:0'],
            'tip_cents' => ['nullable', 'integer', 'min:0'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $session = $this->checkoutSessions->update($checkoutSession, $data);

        return response()->json([
            'data' => $this->checkoutSessions->show($session),
        ]);
    }

    public function complete(Request $request, string $tenantSlug, CheckoutSession $checkoutSession): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);
        $this->assertTenantSession($tenant->id, $checkoutSession);

        $data = $request->validate([
            'payment_method' => ['required', 'string', 'in:cash,card,mobile_money,other'],
            'manual_discount_cents' => ['nullable', 'integer', 'min:0'],
            'approval_request_uuid' => ['nullable', 'uuid'],
        ]);

        try {
            $result = $this->checkoutSessions->complete(
                $checkoutSession,
                $data['payment_method'],
                $request->user(),
                [
                    'manual_discount_cents' => (int) ($data['manual_discount_cents'] ?? 0),
                    'approval_request_uuid' => $data['approval_request_uuid'] ?? null,
                ],
            );
        } catch (InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (\Illuminate\Validation\ValidationException $e) {
            throw $e;
        }

        return response()->json([
            'data' => [
                'session' => $this->checkoutSessions->show($result['session']),
                'sale' => $result['sale'],
            ],
        ]);
    }

    private function assertTenantSession(int $tenantId, CheckoutSession $session): void
    {
        abort_unless($session->tenant_id === $tenantId, 404);
    }
}
