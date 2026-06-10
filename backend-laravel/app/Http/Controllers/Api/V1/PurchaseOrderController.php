<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\V1\Concerns\ResolvesTenantFromRequest;
use App\Http\Controllers\Controller;
use App\Models\PurchaseOrder;
use App\Services\PurchaseOrderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PurchaseOrderController extends Controller
{
    use ResolvesTenantFromRequest;

    public function __construct(
        private readonly PurchaseOrderService $purchaseOrders,
    ) {}

    public function index(Request $request, string $tenantSlug): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);
        $filters = $request->validate([
            'status' => ['nullable', 'string', 'max:32'],
            'supplier_id' => ['nullable', 'integer', 'exists:suppliers,id'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        $paginator = $this->purchaseOrders->paginate($tenant->id, $filters, (int) ($filters['per_page'] ?? 20));

        return response()->json([
            'data' => collect($paginator->items())->map(fn (PurchaseOrder $order) => $this->purchaseOrders->format($order)),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }

    public function store(Request $request, string $tenantSlug): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);
        $data = $request->validate([
            'supplier_id' => ['required', 'integer', 'exists:suppliers,id'],
            'location_id' => ['nullable', 'integer', 'exists:locations,id'],
            'reference' => ['nullable', 'string', 'max:64'],
            'notes' => ['nullable', 'string', 'max:5000'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'integer', 'exists:products,id'],
            'items.*.quantity_ordered' => ['required', 'integer', 'min:1'],
            'items.*.quantity_received' => ['nullable', 'integer', 'min:0'],
            'items.*.unit_cost_cents' => ['nullable', 'integer', 'min:0'],
        ]);

        $order = $this->purchaseOrders->create($tenant->id, $data, $request->user());

        return response()->json(['data' => $this->purchaseOrders->format($order)], 201);
    }

    public function show(Request $request, string $tenantSlug, PurchaseOrder $purchaseOrder): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);
        abort_unless($purchaseOrder->tenant_id === $tenant->id, 404);

        return response()->json(['data' => $this->purchaseOrders->format($purchaseOrder)]);
    }

    public function update(Request $request, string $tenantSlug, PurchaseOrder $purchaseOrder): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);
        abort_unless($purchaseOrder->tenant_id === $tenant->id, 404);

        $data = $request->validate([
            'supplier_id' => ['sometimes', 'integer', 'exists:suppliers,id'],
            'location_id' => ['nullable', 'integer', 'exists:locations,id'],
            'reference' => ['nullable', 'string', 'max:64'],
            'notes' => ['nullable', 'string', 'max:5000'],
            'items' => ['sometimes', 'array'],
            'items.*.product_id' => ['required_with:items', 'integer', 'exists:products,id'],
            'items.*.quantity_ordered' => ['required_with:items', 'integer', 'min:1'],
            'items.*.quantity_received' => ['nullable', 'integer', 'min:0'],
            'items.*.unit_cost_cents' => ['nullable', 'integer', 'min:0'],
        ]);

        $order = $this->purchaseOrders->update($purchaseOrder, $data);

        return response()->json(['data' => $this->purchaseOrders->format($order)]);
    }

    public function send(Request $request, string $tenantSlug, PurchaseOrder $purchaseOrder): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);
        abort_unless($purchaseOrder->tenant_id === $tenant->id, 404);

        $order = $this->purchaseOrders->send($purchaseOrder);

        return response()->json(['data' => $this->purchaseOrders->format($order)]);
    }

    public function receive(Request $request, string $tenantSlug, PurchaseOrder $purchaseOrder): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);
        abort_unless($purchaseOrder->tenant_id === $tenant->id, 404);

        $data = $request->validate([
            'location_id' => ['nullable', 'integer', 'exists:locations,id'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.uuid' => ['required', 'string', 'max:36'],
            'items.*.quantity_received' => ['required', 'integer', 'min:0'],
        ]);

        $order = $this->purchaseOrders->receive($purchaseOrder, $data, $request->user());

        return response()->json(['data' => $this->purchaseOrders->format($order)]);
    }
}
