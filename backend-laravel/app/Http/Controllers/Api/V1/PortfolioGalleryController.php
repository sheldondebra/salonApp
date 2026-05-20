<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\PortfolioGalleryItemResource;
use App\Models\PortfolioGalleryItem;
use App\Models\Tenant;
use App\Services\TenantCatalogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PortfolioGalleryController extends Controller
{
    public function __construct(
        protected TenantCatalogService $catalog,
    ) {}

    public function index(Request $request, string $tenantSlug): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);

        $items = $tenant->portfolioGalleryItems()
            ->orderBy('sort_order')
            ->get();

        return PortfolioGalleryItemResource::collection($items)->response();
    }

    public function store(Request $request, string $tenantSlug): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);

        $validated = $request->validate([
            'title' => ['nullable', 'string', 'max:255'],
            'before_image_url' => ['required', 'url', 'max:2048'],
            'after_image_url' => ['required', 'url', 'max:2048'],
            'caption' => ['nullable', 'string', 'max:1000'],
            'service_id' => ['nullable', 'integer', 'exists:services,id'],
            'is_published' => ['sometimes', 'boolean'],
        ]);

        $item = PortfolioGalleryItem::query()->create(array_merge($validated, [
            'tenant_id' => $tenant->id,
            'sort_order' => $tenant->portfolioGalleryItems()->count() + 1,
        ]));

        return (new PortfolioGalleryItemResource($item))
            ->response()
            ->setStatusCode(201);
    }

    public function update(Request $request, string $tenantSlug, PortfolioGalleryItem $galleryItem): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);
        abort_unless($galleryItem->tenant_id === $tenant->id, 404);

        $validated = $request->validate([
            'title' => ['nullable', 'string', 'max:255'],
            'before_image_url' => ['sometimes', 'url', 'max:2048'],
            'after_image_url' => ['sometimes', 'url', 'max:2048'],
            'caption' => ['nullable', 'string', 'max:1000'],
            'service_id' => ['nullable', 'integer', 'exists:services,id'],
            'is_published' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
        ]);

        $galleryItem->update($validated);

        return (new PortfolioGalleryItemResource($galleryItem->fresh()))->response();
    }

    public function destroy(Request $request, string $tenantSlug, PortfolioGalleryItem $galleryItem): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);
        abort_unless($galleryItem->tenant_id === $tenant->id, 404);

        $galleryItem->delete();

        return response()->json(['message' => 'Gallery item removed']);
    }

    public function sync(Request $request, string $tenantSlug): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);

        $validated = $request->validate([
            'items' => ['required', 'array'],
            'items.*.before_image_url' => ['required', 'url', 'max:2048'],
            'items.*.after_image_url' => ['required', 'url', 'max:2048'],
            'items.*.title' => ['nullable', 'string', 'max:255'],
            'items.*.caption' => ['nullable', 'string', 'max:1000'],
            'items.*.service_id' => ['nullable', 'integer'],
        ]);

        $items = $this->catalog->syncGallery($tenant, $validated['items'], replace: true);

        return PortfolioGalleryItemResource::collection($items)->response();
    }

    protected function tenant(Request $request, string $tenantSlug): Tenant
    {
        /** @var Tenant $tenant */
        $tenant = $request->attributes->get('tenant');
        abort_unless($tenant->slug === $tenantSlug, 404);

        return $tenant;
    }
}
