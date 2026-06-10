<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Services\ClientDiscoveryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ClientDiscoveryController extends Controller
{
    public function __construct(
        private readonly ClientDiscoveryService $discovery,
    ) {}

    public function favorites(Request $request): JsonResponse
    {
        return response()->json([
            'data' => $this->discovery->favorites($request->user()),
        ]);
    }

    public function addFavorite(Request $request): JsonResponse
    {
        $data = $request->validate([
            'tenant_slug' => ['required', 'string', 'max:255'],
        ]);

        $tenant = Tenant::query()->where('slug', $data['tenant_slug'])->firstOrFail();
        $this->discovery->addFavorite($request->user(), $tenant);

        return response()->json(['message' => 'Business added to favorites'], 201);
    }

    public function removeFavorite(Request $request, string $businessSlug): JsonResponse
    {
        $tenant = Tenant::query()->where('slug', $businessSlug)->firstOrFail();
        $this->discovery->removeFavorite($request->user(), $tenant);

        return response()->json(['message' => 'Business removed from favorites']);
    }

    public function recentlyViewed(Request $request): JsonResponse
    {
        return response()->json([
            'data' => $this->discovery->recentlyViewed($request->user()),
        ]);
    }

    public function markViewed(Request $request): JsonResponse
    {
        $data = $request->validate([
            'tenant_slug' => ['required', 'string', 'max:255'],
        ]);

        $tenant = Tenant::query()->where('slug', $data['tenant_slug'])->firstOrFail();
        $this->discovery->markViewed($request->user(), $tenant);

        return response()->json(['message' => 'Business view recorded'], 201);
    }
}
