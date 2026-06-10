<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Services\ScheduleService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ScheduleController extends Controller
{
    public function __construct(
        protected ScheduleService $schedule,
    ) {}

    public function index(Request $request, string $tenantSlug): JsonResponse
    {
        $this->authorize('viewAny', Appointment::class);

        $validated = $request->validate([
            'from' => ['required', 'date'],
            'to' => ['required', 'date', 'after_or_equal:from'],
            'staff_ids' => ['nullable', 'string'],
            'location_id' => ['nullable', 'integer', 'exists:locations,id'],
        ]);

        $from = Carbon::parse($validated['from'])->startOfDay();
        $to = Carbon::parse($validated['to'])->endOfDay();

        $staffIds = null;
        if (! empty($validated['staff_ids'])) {
            $staffIds = array_values(array_filter(array_map(
                'intval',
                explode(',', $validated['staff_ids'])
            )));
        }

        $events = $this->schedule->eventsForRange(
            $from,
            $to,
            $staffIds,
            $validated['location_id'] ?? null,
        );

        return response()->json([
            'data' => $events,
            'meta' => [
                'from' => $from->toIso8601String(),
                'to' => $to->toIso8601String(),
                'staff_count' => $staffIds ? count($staffIds) : null,
            ],
        ]);
    }
}
