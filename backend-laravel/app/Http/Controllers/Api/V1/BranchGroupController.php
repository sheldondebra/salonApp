<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\V1\Concerns\ResolvesTenantFromRequest;
use App\Http\Controllers\Controller;
use App\Models\BranchGroup;
use App\Models\BranchSettingOverride;
use App\Models\Location;
use App\Services\BranchGroupService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class BranchGroupController extends Controller
{
    use ResolvesTenantFromRequest;

    public function __construct(
        private readonly BranchGroupService $branches,
    ) {}

    public function index(Request $request, string $tenantSlug): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);
        $paginator = $this->branches->paginateGroups($tenant->id, $request->integer('per_page', 20));

        return response()->json([
            'data' => collect($paginator->items())->map(fn (BranchGroup $group) => $this->branches->formatGroup($group))->values(),
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
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'manager_user_id' => ['nullable', 'integer', 'exists:users,id'],
            'location_ids' => ['nullable', 'array'],
            'location_ids.*' => ['integer', Rule::exists('locations', 'id')->where('tenant_id', $tenant->id)],
        ]);

        $group = $this->branches->createGroup($tenant->id, $data);

        return response()->json(['data' => $this->branches->formatGroup($group)], 201);
    }

    public function update(Request $request, string $tenantSlug, BranchGroup $branchGroup): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);
        abort_unless($branchGroup->tenant_id === $tenant->id, 404);

        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'manager_user_id' => ['nullable', 'integer', 'exists:users,id'],
            'location_ids' => ['nullable', 'array'],
            'location_ids.*' => ['integer', Rule::exists('locations', 'id')->where('tenant_id', $tenant->id)],
        ]);

        $group = $this->branches->updateGroup($branchGroup, $data);

        return response()->json(['data' => $this->branches->formatGroup($group)]);
    }

    public function destroy(Request $request, string $tenantSlug, BranchGroup $branchGroup): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);
        abort_unless($branchGroup->tenant_id === $tenant->id, 404);

        $this->branches->deleteGroup($branchGroup);

        return response()->json(['message' => 'Branch group deleted']);
    }

    public function overrides(Request $request, string $tenantSlug): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);
        $paginator = $this->branches->paginateOverrides($tenant->id, $request->integer('per_page', 20));

        return response()->json([
            'data' => collect($paginator->items())->map(fn (BranchSettingOverride $override) => $this->branches->formatOverride($override))->values(),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }

    public function saveOverride(Request $request, string $tenantSlug, Location $location): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);
        abort_unless($location->tenant_id === $tenant->id, 404);

        $data = $request->validate([
            'setting_key' => ['required', 'string', 'max:128'],
            'value' => ['nullable'],
        ]);

        $override = $this->branches->saveOverride($tenant->id, $location, $data);

        return response()->json([
            'data' => $this->branches->formatOverride($override),
        ], 201);
    }

    public function destroyOverride(Request $request, string $tenantSlug, BranchSettingOverride $branchSettingOverride): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);
        abort_unless($branchSettingOverride->tenant_id === $tenant->id, 404);

        $this->branches->deleteOverride($branchSettingOverride);

        return response()->json(['message' => 'Branch override deleted']);
    }
}
