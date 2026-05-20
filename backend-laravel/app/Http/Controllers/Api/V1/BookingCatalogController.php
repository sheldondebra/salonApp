<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\LocationResource;
use App\Http\Resources\ServiceResource;
use App\Models\Location;
use App\Models\Service;
use App\Models\StaffMember;
use App\Services\StaffServiceAssignmentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BookingCatalogController extends Controller
{
    public function __construct(
        protected StaffServiceAssignmentService $staffAssignments,
    ) {}
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

    public function staff(Request $request): JsonResponse
    {
        $serviceIds = $this->resolveServiceIds($request);

        $query = StaffMember::query()
            ->whereBool('is_active')
            ->whereBool('is_bookable')
            ->orderBy('display_name');

        if ($serviceIds !== []) {
            $this->staffAssignments->applyBookableForServices($query, $serviceIds);
        }

        $staff = $query->get(['id', 'uuid', 'display_name', 'title']);

        return response()->json(['data' => $staff]);
    }

    /**
     * @return list<int>
     */
    protected function resolveServiceIds(Request $request): array
    {
        if ($request->filled('service_id')) {
            return [(int) $request->integer('service_id')];
        }

        $ids = $request->input('service_ids', []);
        if (! is_array($ids)) {
            return [];
        }

        return array_values(array_unique(array_map('intval', array_filter($ids))));
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
