<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\StaffMemberResource;
use App\Http\Resources\StaffServiceResource;
use App\Models\Service;
use App\Models\StaffMember;
use App\Models\StaffService;
use App\Services\StaffServiceAssignmentService;
use App\Support\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class StaffMemberServiceController extends Controller
{
    public function __construct(
        protected StaffServiceAssignmentService $assignments,
    ) {}

    public function index(Request $request, string $tenantSlug, StaffMember $staffMember): JsonResponse
    {
        $this->authorize('view', $staffMember);

        $rows = StaffService::query()
            ->where('staff_member_id', $staffMember->id)
            ->with(['service.category'])
            ->orderByDesc('is_active')
            ->orderBy('id')
            ->get();

        return response()->json(['data' => StaffServiceResource::collection($rows)]);
    }

    public function store(Request $request, string $tenantSlug, StaffMember $staffMember): JsonResponse
    {
        $this->authorize('update', $staffMember);

        $tenantId = TenantContext::id();
        $validated = $request->validate([
            'service_id' => [
                'required',
                'integer',
                Rule::exists('services', 'id')->where('tenant_id', $tenantId),
            ],
            'custom_duration_minutes' => ['nullable', 'integer', 'min:5', 'max:480'],
            'custom_price_cents' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $row = StaffService::query()->updateOrCreate(
            [
                'staff_member_id' => $staffMember->id,
                'service_id' => $validated['service_id'],
            ],
            [
                'tenant_id' => $tenantId,
                'custom_duration_minutes' => $validated['custom_duration_minutes'] ?? null,
                'custom_price_cents' => $validated['custom_price_cents'] ?? null,
                'is_active' => $validated['is_active'] ?? true,
            ]
        );

        $row->load(['service.category']);

        return (new StaffServiceResource($row))->response()->setStatusCode(201);
    }

    public function update(
        Request $request,
        string $tenantSlug,
        StaffMember $staffMember,
        StaffService $staffService,
    ): JsonResponse {
        $this->authorize('update', $staffMember);
        $this->assertPivot($staffMember, $staffService);

        $validated = $request->validate([
            'custom_duration_minutes' => ['nullable', 'integer', 'min:5', 'max:480'],
            'custom_price_cents' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $staffService->update($validated);
        $staffService->load(['service.category']);

        return (new StaffServiceResource($staffService))->response();
    }

    public function destroy(
        Request $request,
        string $tenantSlug,
        StaffMember $staffMember,
        StaffService $staffService,
    ): JsonResponse {
        $this->authorize('update', $staffMember);
        $this->assertPivot($staffMember, $staffService);

        $staffService->update(['is_active' => false]);

        return response()->json(['message' => 'Service removed from staff member.']);
    }

    public function bulk(Request $request, string $tenantSlug, StaffMember $staffMember): JsonResponse
    {
        $this->authorize('update', $staffMember);

        $tenantId = TenantContext::id();
        $validated = $request->validate([
            'service_ids' => ['required', 'array'],
            'service_ids.*' => [
                'integer',
                Rule::exists('services', 'id')->where('tenant_id', $tenantId),
            ],
            'replace' => ['sometimes', 'boolean'],
        ]);

        $rows = $this->assignments->syncBulk(
            $staffMember,
            $validated['service_ids'],
            $validated['replace'] ?? true,
        );

        $rows->each->load(['service.category']);

        return response()->json([
            'data' => StaffServiceResource::collection($rows),
            'message' => 'Staff services updated.',
        ]);
    }

    public function staffForService(Request $request, string $tenantSlug, Service $service): JsonResponse
    {
        $this->authorize('view', $service);

        $serviceIds = [$service->id];
        if ($request->filled('service_ids')) {
            $serviceIds = array_map('intval', (array) $request->input('service_ids'));
            $serviceIds[] = $service->id;
            $serviceIds = array_values(array_unique($serviceIds));
        }

        $staff = StaffMember::query()
            ->whereBool('is_active', true)
            ->whereBool('is_bookable', true)
            ->where(function ($q) use ($serviceIds) {
                $this->assignments->applyBookableForServices($q, $serviceIds);
            })
            ->orderBy('display_name')
            ->get();

        return StaffMemberResource::collection($staff)->response();
    }

    protected function assertPivot(StaffMember $staffMember, StaffService $staffService): void
    {
        if ($staffService->staff_member_id !== $staffMember->id) {
            abort(404);
        }
    }
}
