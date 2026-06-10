<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\V1\Concerns\ResolvesTenantFromRequest;
use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Services\MarketplaceProfileService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MarketplaceController extends Controller
{
    use ResolvesTenantFromRequest;

    public function __construct(
        private readonly MarketplaceProfileService $profiles,
    ) {}

    public function searchNearby(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'q' => ['nullable', 'string', 'max:100'],
            'category' => ['nullable', 'string', 'max:100'],
            'lat' => ['nullable', 'numeric'],
            'lng' => ['nullable', 'numeric'],
            'radius_km' => ['nullable', 'numeric', 'min:1', 'max:500'],
            'min_rating' => ['nullable', 'numeric', 'min:0', 'max:5'],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        return response()->json($this->profiles->search($filters));
    }

    public function serviceSearch(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'q' => ['nullable', 'string', 'max:100'],
            'category' => ['nullable', 'string', 'max:100'],
            'max_price_cents' => ['nullable', 'integer', 'min:0'],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        return response()->json($this->profiles->serviceSearch($filters));
    }

    public function featured(Request $request): JsonResponse
    {
        return response()->json([
            'data' => $this->profiles->featured($request->integer('limit', 8)),
        ]);
    }

    public function profile(Request $request, string $tenantSlug): JsonResponse
    {
        $tenant = Tenant::query()
            ->where('slug', $tenantSlug)
            ->with(['marketplaceProfile.tenantModel.services.category', 'marketplaceProfile.tenantModel.locations'])
            ->firstOrFail();

        abort_unless($tenant->marketplaceProfile && $tenant->marketplaceProfile->is_published, 404);

        return response()->json([
            'data' => $this->profiles->formatPublicProfile($tenant->marketplaceProfile),
        ]);
    }

    public function tenantProfile(Request $request, string $tenantSlug): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);
        $tenant->load(['marketplaceProfile.tenantModel.services.category', 'marketplaceProfile.tenantModel.locations']);
        abort_unless($tenant->marketplaceProfile && $tenant->marketplaceProfile->is_published, 404);

        return response()->json([
            'data' => $this->profiles->formatPublicProfile($tenant->marketplaceProfile),
        ]);
    }
}
