<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\CouponScope;
use App\Http\Controllers\Controller;
use App\Http\Resources\CouponResource;
use App\Models\Coupon;
use App\Services\CouponService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CouponAdminController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Coupon::query()
            ->withoutGlobalScope('tenant')
            ->whereNull('tenant_id')
            ->orderByDesc('created_at');

        if ($search = $request->string('q')->trim()->toString()) {
            $query->where('code', 'like', '%'.strtoupper($search).'%');
        }

        if ($request->filled('active')) {
            $query->whereBool('is_active', $request->boolean('active'));
        }

        if ($request->filled('scope')) {
            $query->where('scope', $request->string('scope')->toString());
        }

        $coupons = $query->paginate(min($request->integer('per_page', 20), 50));

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
        $coupons->assertCodeAvailable($validated['code'], null);

        $coupon = Coupon::query()->create([
            ...$validated,
            'tenant_id' => null,
        ]);

        return response()->json(['data' => new CouponResource($coupon)], 201);
    }

    public function update(Request $request, Coupon $coupon, CouponService $coupons): JsonResponse
    {
        if ($coupon->tenant_id !== null) {
            abort(404);
        }

        $validated = $this->validated($request, updating: true);

        if (isset($validated['code'])) {
            $coupons->assertCodeAvailable($validated['code'], null, $coupon->id);
        }

        $coupon->update($validated);

        return response()->json(['data' => new CouponResource($coupon->fresh())]);
    }

    public function destroy(Coupon $coupon): JsonResponse
    {
        if ($coupon->tenant_id !== null) {
            abort(404);
        }

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
            'scope' => [$updating ? 'sometimes' : 'required', Rule::in(['subscription', 'booking', 'both'])],
            'max_redemptions' => ['nullable', 'integer', 'min:1'],
            'starts_at' => ['nullable', 'date'],
            'expires_at' => ['nullable', 'date'],
            'is_active' => ['sometimes', 'boolean'],
            'metadata' => ['nullable', 'array'],
            'metadata.plan_ids' => ['nullable', 'array'],
            'metadata.plan_ids.*' => ['string', 'max:50'],
            'metadata.min_amount_cents' => ['nullable', 'integer', 'min:0'],
        ]);

        if (isset($data['code'])) {
            $data['code'] = strtoupper(trim($data['code']));
        }

        if (isset($data['type']) && $data['type'] === 'percent' && isset($data['value'])) {
            $data['value'] = min(100, (int) $data['value']);
        }

        if (isset($data['scope'])) {
            $data['scope'] = CouponScope::from($data['scope']);
        }

        return $data;
    }
}
