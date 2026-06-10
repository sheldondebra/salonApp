<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\V1\Concerns\ResolvesTenantFromRequest;
use App\Http\Controllers\Controller;
use App\Services\MarketplaceProfileService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MarketplaceProfileController extends Controller
{
    use ResolvesTenantFromRequest;

    public function __construct(
        private readonly MarketplaceProfileService $profiles,
    ) {}

    public function show(Request $request, string $tenantSlug): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);
        $profile = $this->profiles->forTenant($tenant->id);
        $profile->loadMissing(['tenantModel.services.category', 'tenantModel.locations']);

        return response()->json([
            'data' => $this->profiles->formatAdminProfile($profile),
        ]);
    }

    public function update(Request $request, string $tenantSlug): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);
        $data = $request->validate([
            'headline' => ['nullable', 'string', 'max:255'],
            'bio' => ['nullable', 'string', 'max:5000'],
            'categories' => ['nullable', 'array'],
            'categories.*' => ['string', 'max:100'],
            'photos' => ['nullable', 'array'],
            'photos.*' => ['string', 'max:2048'],
            'is_published' => ['sometimes', 'boolean'],
            'average_rating' => ['nullable', 'numeric', 'min:0', 'max:5'],
            'review_count' => ['nullable', 'integer', 'min:0'],
        ]);

        $profile = $this->profiles->update($tenant->id, $data);
        $profile->loadMissing(['tenantModel.services.category', 'tenantModel.locations']);

        return response()->json([
            'data' => $this->profiles->formatAdminProfile($profile),
            'message' => 'Marketplace profile saved',
        ]);
    }
}
