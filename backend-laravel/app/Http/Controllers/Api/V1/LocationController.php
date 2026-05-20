<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\V1\Concerns\ResolvesTenantFromRequest;
use App\Http\Controllers\Controller;
use App\Http\Resources\LocationResource;
use App\Models\Location;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LocationController extends Controller
{
    use ResolvesTenantFromRequest;

    public function index(Request $request, string $tenantSlug): JsonResponse
    {
        $this->authorize('viewAny', Location::class);

        $query = Location::query()->orderBy('name');

        if ($search = $request->string('q')->trim()->toString()) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('city', 'like', "%{$search}%");
            });
        }

        if ($request->filled('is_active')) {
            $query->whereBool('is_active', $request->boolean('is_active'));
        }

        $paginated = $query->paginate(min($request->integer('per_page', 20), 50));

        return LocationResource::collection($paginated)->response();
    }

    public function store(Request $request, string $tenantSlug): JsonResponse
    {
        $this->authorize('create', Location::class);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'address_line1' => ['nullable', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:120'],
            'country' => ['nullable', 'string', 'max:100'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $location = Location::query()->create($validated);

        return (new LocationResource($location))
            ->response()
            ->setStatusCode(201);
    }

    public function update(Request $request, string $tenantSlug, Location $location): JsonResponse
    {
        $this->authorize('update', $location);

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'address_line1' => ['nullable', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:120'],
            'country' => ['nullable', 'string', 'max:100'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $location->update($validated);

        return (new LocationResource($location->fresh()))->response();
    }

    public function destroy(Request $request, string $tenantSlug, Location $location): JsonResponse
    {
        $this->authorize('delete', $location);

        $location->delete();

        return response()->json(['message' => 'Branch removed.']);
    }
}
