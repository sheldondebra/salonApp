<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\StaffWorkingHourResource;
use App\Models\StaffMember;
use App\Services\StaffWorkingHoursService;
use App\Support\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class StaffWorkingHourController extends Controller
{
    public function __construct(
        protected StaffWorkingHoursService $workingHours,
    ) {}

    public function index(Request $request, string $tenantSlug, StaffMember $staffMember): JsonResponse
    {
        $this->authorize('view', $staffMember);

        $locationId = $request->filled('location_id')
            ? $request->integer('location_id')
            : $staffMember->location_id;

        $week = $this->workingHours->forStaff($staffMember, $locationId);

        return response()->json([
            'data' => StaffWorkingHourResource::collection($week),
            'meta' => [
                'has_custom_schedule' => $this->workingHours->staffHasCustomSchedule($staffMember->id),
                'summary' => $this->buildSummary($week),
            ],
        ]);
    }

    public function update(Request $request, string $tenantSlug, StaffMember $staffMember): JsonResponse
    {
        $this->authorize('update', $staffMember);

        $tenantId = TenantContext::id();
        $validated = $request->validate([
            'location_id' => [
                'nullable',
                'integer',
                Rule::exists('locations', 'id')->where('tenant_id', $tenantId),
            ],
            'days' => ['required', 'array', 'min:1', 'max:7'],
            'days.*.day_of_week' => ['required', 'integer', 'min:1', 'max:7'],
            'days.*.is_working_day' => ['required', 'boolean'],
            'days.*.start_time' => ['nullable', 'date_format:H:i'],
            'days.*.end_time' => ['nullable', 'date_format:H:i'],
        ]);

        $week = $this->workingHours->syncWeek(
            $staffMember,
            $validated['days'],
            $validated['location_id'] ?? $staffMember->location_id,
        );

        return response()->json([
            'data' => StaffWorkingHourResource::collection($week),
            'meta' => ['summary' => $this->buildSummary($week)],
            'message' => 'Working hours saved.',
        ]);
    }

    public function copy(Request $request, string $tenantSlug, StaffMember $staffMember): JsonResponse
    {
        $this->authorize('update', $staffMember);

        $validated = $request->validate([
            'from_day' => ['required', 'integer', 'min:1', 'max:7'],
            'to_days' => ['required', 'array', 'min:1'],
            'to_days.*' => ['integer', 'min:1', 'max:7'],
            'location_id' => ['nullable', 'integer'],
        ]);

        $week = $this->workingHours->copyDay(
            $staffMember,
            (int) $validated['from_day'],
            array_map('intval', $validated['to_days']),
            $validated['location_id'] ?? $staffMember->location_id,
        );

        return response()->json([
            'data' => StaffWorkingHourResource::collection($week),
            'meta' => ['summary' => $this->buildSummary($week)],
            'message' => 'Schedule copied.',
        ]);
    }

    public function apply(Request $request, string $tenantSlug): JsonResponse
    {
        $this->authorize('viewAny', StaffMember::class);

        $tenantId = TenantContext::id();
        $validated = $request->validate([
            'staff_ids' => ['required', 'array', 'min:1'],
            'staff_ids.*' => [
                'integer',
                Rule::exists('staff_members', 'id')->where('tenant_id', $tenantId),
            ],
            'location_id' => ['nullable', 'integer'],
            'days' => ['required', 'array', 'min:1', 'max:7'],
            'days.*.day_of_week' => ['required', 'integer', 'min:1', 'max:7'],
            'days.*.is_working_day' => ['required', 'boolean'],
            'days.*.start_time' => ['nullable', 'date_format:H:i'],
            'days.*.end_time' => ['nullable', 'date_format:H:i'],
        ]);

        $count = $this->workingHours->applyToStaffIds(
            $validated['staff_ids'],
            $validated['days'],
            $validated['location_id'] ?? null,
        );

        return response()->json([
            'message' => "Schedule applied to {$count} staff member(s).",
            'applied_count' => $count,
        ]);
    }

    /**
     * @param  \Illuminate\Support\Collection<int, \App\Models\StaffWorkingHour>  $week
     * @return array{working_days: int, weekly_hours: float}
     */
    protected function buildSummary($week): array
    {
        $workingDays = 0;
        $minutes = 0;

        foreach ($week as $row) {
            if (! $row->is_working_day) {
                continue;
            }
            $workingDays++;
            $start = $row->startTimeHi();
            $end = $row->endTimeHi();
            if ($start && $end) {
                $minutes += max(0, (strtotime($end) - strtotime($start)) / 60);
            }
        }

        return [
            'working_days' => $workingDays,
            'weekly_hours' => round($minutes / 60, 1),
        ];
    }
}
