<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\V1\Concerns\ResolvesTenantFromRequest;
use App\Http\Controllers\Controller;
use App\Models\MarketplaceCommissionRule;
use App\Services\MarketplaceCommissionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MarketplaceCommissionController extends Controller
{
    use ResolvesTenantFromRequest;

    public function __construct(
        private readonly MarketplaceCommissionService $commissions,
    ) {}

    public function index(Request $request, string $tenantSlug): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);
        $paginator = $this->commissions->paginate($tenant->id, $request->integer('per_page', 20));

        return response()->json([
            'data' => collect($paginator->items())->map(fn (MarketplaceCommissionRule $rule) => $this->commissions->formatRule($rule))->values(),
            'analytics' => $this->commissions->analytics($tenant->id),
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
            'name' => ['required', 'string', 'max:255'],
            'percent' => ['sometimes', 'integer', 'min:0', 'max:100'],
            'flat_fee_cents' => ['sometimes', 'integer', 'min:0'],
            'applies_to' => ['sometimes', 'string', 'max:32'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $rule = $this->commissions->create($tenant->id, $data);

        return response()->json(['data' => $this->commissions->formatRule($rule)], 201);
    }

    public function update(Request $request, string $tenantSlug, MarketplaceCommissionRule $marketplaceCommissionRule): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);
        abort_unless($marketplaceCommissionRule->tenant_id === $tenant->id, 404);

        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'percent' => ['sometimes', 'integer', 'min:0', 'max:100'],
            'flat_fee_cents' => ['sometimes', 'integer', 'min:0'],
            'applies_to' => ['sometimes', 'string', 'max:32'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $rule = $this->commissions->update($marketplaceCommissionRule, $data);

        return response()->json(['data' => $this->commissions->formatRule($rule)]);
    }

    public function destroy(Request $request, string $tenantSlug, MarketplaceCommissionRule $marketplaceCommissionRule): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);
        abort_unless($marketplaceCommissionRule->tenant_id === $tenant->id, 404);

        $this->commissions->delete($marketplaceCommissionRule);

        return response()->json(['message' => 'Marketplace commission rule deleted']);
    }
}
