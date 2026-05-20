<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\CouponScope;
use App\Http\Controllers\Controller;
use App\Http\Resources\SaleResource;
use App\Models\Sale;
use App\Services\CouponService;
use App\Services\PosService;
use App\Support\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use InvalidArgumentException;

class SaleController extends Controller
{
    public function __construct(
        protected PosService $pos,
        protected CouponService $coupons,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Sale::class);

        $sales = Sale::query()
            ->with(['client', 'location'])
            ->orderByDesc('created_at')
            ->paginate(min($request->integer('per_page', 20), 50));

        return response()->json([
            'data' => SaleResource::collection($sales),
            'meta' => [
                'current_page' => $sales->currentPage(),
                'last_page' => $sales->lastPage(),
                'total' => $sales->total(),
            ],
        ]);
    }

    public function show(Sale $sale): JsonResponse
    {
        $this->authorize('view', $sale);

        $sale->load(['items', 'client', 'location', 'appointment', 'payment']);

        return response()->json(['data' => new SaleResource($sale)]);
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorize('create', Sale::class);

        $tenantId = TenantContext::id();

        $validated = $request->validate([
            'location_id' => ['required', 'integer', Rule::exists('locations', 'id')->where('tenant_id', $tenantId)],
            'client_user_id' => ['nullable', 'integer', Rule::exists('users', 'id')],
            'appointment_uuid' => ['nullable', 'uuid'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.type' => ['required', Rule::in(['service', 'product'])],
            'items.*.service_id' => ['required_if:items.*.type,service', 'integer'],
            'items.*.product_id' => ['required_if:items.*.type,product', 'integer'],
            'items.*.quantity' => ['nullable', 'integer', 'min:1', 'max:999'],
            'coupon_code' => ['nullable', 'string', 'max:50'],
            'tax_cents' => ['nullable', 'integer', 'min:0'],
            'service_charge_cents' => ['nullable', 'integer', 'min:0'],
            'tip_cents' => ['nullable', 'integer', 'min:0'],
            'payment_method' => ['required', Rule::in(['cash', 'card', 'mobile_money', 'other'])],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);

        try {
            $sale = $this->pos->completeSale($validated, $request->user());
        } catch (InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json(['data' => new SaleResource($sale)], 201);
    }

    public function validateCoupon(Request $request): JsonResponse
    {
        $this->authorize('create', Sale::class);

        $validated = $request->validate([
            'code' => ['required', 'string', 'max:50'],
            'amount_cents' => ['required', 'integer', 'min:1'],
            'service_ids' => ['nullable', 'array'],
            'service_ids.*' => ['integer'],
        ]);

        $tenantId = TenantContext::id();

        $result = $this->coupons->validate($validated['code'], [
            'scope' => CouponScope::Booking,
            'tenant_id' => $tenantId,
            'service_ids' => array_values($validated['service_ids'] ?? []),
            'amount_cents' => (int) $validated['amount_cents'],
        ]);

        return response()->json([
            'valid' => $result['valid'],
            'message' => $result['message'],
            'discount_cents' => $result['discount_cents'],
            'final_amount_cents' => $result['final_amount_cents'],
        ]);
    }
}
