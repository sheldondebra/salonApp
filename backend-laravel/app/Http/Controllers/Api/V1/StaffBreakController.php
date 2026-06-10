<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\StaffBreakResource;
use App\Models\StaffBreak;
use App\Models\StaffMember;
use App\Services\StaffBreakService;
use App\Support\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class StaffBreakController extends Controller
{
    public function __construct(
        protected StaffBreakService $breaks,
    ) {}

    public function index(string $tenantSlug, StaffMember $staffMember): JsonResponse
    {
        $this->authorize('view', $staffMember);

        return response()->json([
            'data' => StaffBreakResource::collection($this->breaks->listForStaff($staffMember->id)),
        ]);
    }

    public function store(Request $request, string $tenantSlug, StaffMember $staffMember): JsonResponse
    {
        $this->authorize('update', $staffMember);

        $validated = $this->validatePayload($request, TenantContext::id());

        $break = $this->breaks->create($staffMember->id, TenantContext::id(), $validated);

        return response()->json([
            'data' => new StaffBreakResource($break),
            'message' => 'Break added',
        ], 201);
    }

    public function update(
        Request $request,
        string $tenantSlug,
        StaffMember $staffMember,
        StaffBreak $staffBreak,
    ): JsonResponse {
        $this->authorize('update', $staffMember);
        abort_unless($staffBreak->staff_member_id === $staffMember->id, 404);

        $validated = $this->validatePayload($request, TenantContext::id(), partial: true);
        $break = $this->breaks->update($staffBreak, $validated);

        return response()->json([
            'data' => new StaffBreakResource($break),
            'message' => 'Break updated',
        ]);
    }

    public function destroy(string $tenantSlug, StaffMember $staffMember, StaffBreak $staffBreak): JsonResponse
    {
        $this->authorize('update', $staffMember);
        abort_unless($staffBreak->staff_member_id === $staffMember->id, 404);

        $staffBreak->delete();

        return response()->json(['message' => 'Break removed']);
    }

    /**
     * @return array<string, mixed>
     */
    protected function validatePayload(Request $request, int $tenantId, bool $partial = false): array
    {
        $rules = [
            'location_id' => ['nullable', 'integer', Rule::exists('locations', 'id')->where('tenant_id', $tenantId)],
            'title' => [$partial ? 'sometimes' : 'required', 'string', 'max:120'],
            'break_type' => ['sometimes', 'string', Rule::in(['lunch', 'short_break', 'meeting', 'personal', 'training', 'other'])],
            'day_of_week' => ['nullable', 'integer', 'min:1', 'max:7'],
            'start_time' => [$partial ? 'sometimes' : 'required', 'date_format:H:i'],
            'end_time' => [$partial ? 'sometimes' : 'required', 'date_format:H:i'],
            'repeats_weekly' => ['sometimes', 'boolean'],
            'date' => ['nullable', 'date'],
            'note' => ['nullable', 'string', 'max:500'],
        ];

        return $request->validate($rules);
    }
}
