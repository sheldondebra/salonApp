<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
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

        return response()->json([
            'tenant' => new TenantResource($tenant),
            'resolution' => TenantContext::resolutionSource()?->value,
            'booking' => [
                'slug' => $tenant->slug,
                'accepts_public_bookings' => true,
            ],
        ]);
    }
}
