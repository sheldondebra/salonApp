<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\ServiceResource;
use App\Models\Service;
use App\Models\StaffMember;
use Illuminate\Http\JsonResponse;

class BookingCatalogController extends Controller
{
    public function services(): JsonResponse
    {
        $services = Service::query()
            ->with('category')
            ->where('is_active', true)
            ->orderBy('name')
            ->get();

        return response()->json([
            'data' => ServiceResource::collection($services),
        ]);
    }

    public function staff(): JsonResponse
    {
        $staff = StaffMember::query()
            ->where('is_active', true)
            ->where('is_bookable', true)
            ->orderBy('display_name')
            ->get(['id', 'uuid', 'display_name', 'title']);

        return response()->json(['data' => $staff]);
    }
}
