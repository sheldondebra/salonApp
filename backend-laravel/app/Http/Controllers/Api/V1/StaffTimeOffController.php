<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\StaffTimeOffResource;
use App\Models\StaffMember;
use App\Models\StaffTimeOffRequest;
use App\Services\StaffTimeOffService;
use App\Support\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class StaffTimeOffController extends Controller
{
    public function __construct(
        protected StaffTimeOffService $timeOff,
    ) {}

    public function index(string $tenantSlug, StaffMember $staffMember): JsonResponse
    {
        $this->authorize('view', $staffMember);

        return response()->json([
            'data' => StaffTimeOffResource::collection($this->timeOff->listForStaff($staffMember->id)),
        ]);
    }

    public function store(Request $request, string $tenantSlug, StaffMember $staffMember): JsonResponse
    {
        $this->authorize('update', $staffMember);

        $validated = $request->validate([
            'location_id' => ['nullable', 'integer', Rule::exists('locations', 'id')->where('tenant_id', TenantContext::id())],
            'purpose' => ['required', 'string', Rule::in(['vacation', 'sick_leave', 'personal', 'training', 'other'])],
            'custom_purpose' => ['nullable', 'string', 'max:120'],
            'start_at' => ['required', 'date'],
            'end_at' => ['required', 'date', 'after:start_at'],
            'all_day' => ['sometimes', 'boolean'],
            'note' => ['nullable', 'string', 'max:500'],
        ]);

        $row = $this->timeOff->createApprovedBlock(
            $staffMember->id,
            TenantContext::id(),
            $validated,
            $request->user()?->id,
        );

        return response()->json([
            'data' => new StaffTimeOffResource($row),
            'message' => 'Time off added',
        ], 201);
    }

    public function update(
        Request $request,
        string $tenantSlug,
        StaffMember $staffMember,
        StaffTimeOffRequest $staffTimeOff,
    ): JsonResponse {
        $this->authorize('update', $staffMember);
        abort_unless($staffTimeOff->staff_member_id === $staffMember->id, 404);

        $validated = $request->validate([
            'status' => ['sometimes', 'string', Rule::in(['cancelled'])],
            'note' => ['nullable', 'string', 'max:500'],
        ]);

        if (($validated['status'] ?? null) === 'cancelled') {
            $staffTimeOff = $this->timeOff->cancel($staffTimeOff);
        } elseif (isset($validated['note'])) {
            $staffTimeOff->update(['note' => $validated['note']]);
            $staffTimeOff->refresh();
        }

        return response()->json([
            'data' => new StaffTimeOffResource($staffTimeOff),
            'message' => 'Time off updated',
        ]);
    }
}
