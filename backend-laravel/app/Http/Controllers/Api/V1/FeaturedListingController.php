<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\FeaturedListingStatus;
use App\Http\Controllers\Api\V1\Concerns\ResolvesTenantFromRequest;
use App\Http\Controllers\Controller;
use App\Models\FeaturedListing;
use App\Services\FeaturedListingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class FeaturedListingController extends Controller
{
    use ResolvesTenantFromRequest;

    public function __construct(
        private readonly FeaturedListingService $featured,
    ) {}

    public function index(Request $request, string $tenantSlug): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);
        $paginator = $this->featured->paginate($tenant->id, $request->integer('per_page', 20));

        return response()->json([
            'data' => collect($paginator->items())->map(fn (FeaturedListing $listing) => $this->featured->formatListing($listing))->values(),
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
            'placement' => ['required', 'string', 'max:64'],
            'starts_at' => ['nullable', 'date'],
            'ends_at' => ['nullable', 'date', 'after_or_equal:starts_at'],
            'is_sponsored' => ['sometimes', 'boolean'],
            'billing_cents' => ['sometimes', 'integer', 'min:0'],
            'status' => ['sometimes', Rule::in(FeaturedListingStatus::values())],
        ]);

        $listing = $this->featured->create($tenant->id, $data);

        return response()->json(['data' => $this->featured->formatListing($listing)], 201);
    }

    public function update(Request $request, string $tenantSlug, FeaturedListing $featuredListing): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);
        abort_unless($featuredListing->tenant_id === $tenant->id, 404);

        $data = $request->validate([
            'placement' => ['sometimes', 'string', 'max:64'],
            'starts_at' => ['nullable', 'date'],
            'ends_at' => ['nullable', 'date', 'after_or_equal:starts_at'],
            'is_sponsored' => ['sometimes', 'boolean'],
            'billing_cents' => ['sometimes', 'integer', 'min:0'],
            'status' => ['sometimes', Rule::in(FeaturedListingStatus::values())],
        ]);

        $listing = $this->featured->update($featuredListing, $data);

        return response()->json(['data' => $this->featured->formatListing($listing)]);
    }

    public function destroy(Request $request, string $tenantSlug, FeaturedListing $featuredListing): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);
        abort_unless($featuredListing->tenant_id === $tenant->id, 404);

        $this->featured->delete($featuredListing);

        return response()->json(['message' => 'Featured listing deleted']);
    }
}
