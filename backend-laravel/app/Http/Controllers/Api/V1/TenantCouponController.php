<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\CouponScope;
use App\Http\Controllers\Controller;
use App\Http\Resources\CouponResource;
use App\Models\Coupon;
use App\Services\CouponService;
use App\Support\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class TenantCouponController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $tenantId = TenantContext::id();

        $coupons = Coupon::query()
            ->where('tenant_id', $tenantId)
            ->orderByDesc('created_at')
            ->paginate(min($request->integer('per_page', 20), 50));

        return response()->json([
            'data' => CouponResource::collection($coupons),
            'meta' => [
                'current_page' => $coupons->currentPage(),
                'last_page' => $coupons->lastPage(),
                'total' => $coupons->total(),
            ],
        ]);
    }

    public function store(Request $request, CouponService $coupons): JsonResponse
    {
        $validated = $this->validated($request);
        $coupons->assertCodeAvailable($validated['code'], TenantContext::id());

        $coupon = Coupon::query()->create([
            ...$validated,
            'tenant_id' => TenantContext::id(),
            'scope' => CouponScope::Booking,
        ]);

        return response()->json(['data' => new CouponResource($coupon)], 201);
    }

    public function update(Request $request, Coupon $coupon, CouponService $coupons): JsonResponse
    {
        $this->ensureTenantCoupon($coupon);

        $validated = $this->validated($request, updating: true);

        if (isset($validated['code'])) {
            $coupons->assertCodeAvailable($validated['code'], $coupon->tenant_id, $coupon->id);
        }

        $coupon->update($validated);

        return response()->json(['data' => new CouponResource($coupon->fresh())]);
    }

    public function destroy(Coupon $coupon): JsonResponse
    {
        $this->ensureTenantCoupon($coupon);
        $coupon->delete();

        return response()->json(['message' => 'Coupon removed.']);
    }

    /** @return array<string, mixed> */
    protected function validated(Request $request, bool $updating = false): array
    {
        $data = $request->validate([
            'code' => [$updating ? 'sometimes' : 'required', 'string', 'max:40'],
            'type' => [$updating ? 'sometimes' : 'required', Rule::in(['percent', 'fixed'])],
            'value' => [$updating ? 'sometimes' : 'required', 'integer', 'min:1'],
            'max_redemptions' => ['nullable', 'integer', 'min:1'],
            'starts_at' => ['nullable', 'date'],
            'expires_at' => ['nullable', 'date', 'after:starts_at'],
            'is_active' => ['sometimes', 'boolean'],
            'metadata' => ['nullable', 'array'],
            'metadata.min_amount_cents' => ['nullable', 'integer', 'min:0'],
            'metadata.service_ids' => ['nullable', 'array'],
            'metadata.service_ids.*' => ['integer'],
        ]);

        if (isset($data['code'])) {
            $data['code'] = strtoupper(trim($data['code']));
        }

        if (isset($data['type']) && $data['type'] === 'percent' && isset($data['value'])) {
            $data['value'] = min(100, (int) $data['value']);
        }

        return $data;
    }

    protected function ensureTenantCoupon(Coupon $coupon): void
    {
        if ($coupon->tenant_id !== TenantContext::id()) {
            abort(404);
        }
    }
}
