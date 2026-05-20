<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\PortfolioGalleryItemResource;
use App\Http\Resources\TenantResource;
use App\Support\TenantContext;
use Illuminate\Http\JsonResponse;

class TenantContextController extends Controller
{
    public function __invoke(): JsonResponse
    {
        $tenant = TenantContext::get();

        if (! $tenant) {
            return response()->json(['message' => 'Tenant not found'], 404);
        }

        $tenant->loadMissing('domains');

        $gallery = $tenant->portfolioGalleryItems()
            ->whereBool('is_published')
            ->orderBy('sort_order')
            ->limit(12)
            ->get();

        return response()->json([
            'tenant' => new TenantResource($tenant),
            'resolution' => TenantContext::resolutionSource()?->value,
            'booking' => [
                'slug' => $tenant->slug,
                'accepts_public_bookings' => true,
                'multiple_locations' => $tenant->multipleLocationsEnabled(),
                'location_mode' => $tenant->bookingLocationMode(),
                'locations_count' => $tenant->activeLocationsCount(),
                'business_type' => $tenant->businessTypeKey(),
                'business_type_label' => $tenant->businessTypeLabel(),
                'payments' => $tenant->paymentSettings(),
                'currency' => $tenant->currency ?: config('billing.currency', 'GHS'),
            ],
            'portfolio_gallery' => PortfolioGalleryItemResource::collection($gallery),
        ]);
    }
}
