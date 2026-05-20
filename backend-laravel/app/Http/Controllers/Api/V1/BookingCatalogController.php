<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\LocationResource;
use App\Http\Resources\ServiceResource;
use App\Models\Location;
use App\Models\Service;
use App\Models\StaffMember;
use Illuminate\Http\JsonResponse;

class BookingCatalogController extends Controller
{
    public function services(): JsonResponse
    {
        $services = Service::query()
            ->with('category')
            ->whereBool('is_active')
            ->orderBy('name')
            ->get();

        return response()->json([
            'data' => ServiceResource::collection($services),
        ]);
    }

    public function staff(): JsonResponse
    {
        $staff = StaffMember::query()
            ->whereBool('is_active')
            ->whereBool('is_bookable')
            ->orderBy('display_name')
            ->get(['id', 'uuid', 'display_name', 'title']);

        return response()->json(['data' => $staff]);
    }

    public function locations(): JsonResponse
    {
        $tenant = \App\Support\TenantContext::get();
        $locations = Location::query()
            ->whereBool('is_active')
            ->orderBy('name')
            ->get();

        return response()->json([
            'data' => LocationResource::collection($locations),
            'meta' => [
                'location_mode' => $tenant?->bookingLocationMode() ?? 'none',
                'multiple_locations' => $tenant?->multipleLocationsEnabled() ?? false,
            ],
        ]);
    }
}
