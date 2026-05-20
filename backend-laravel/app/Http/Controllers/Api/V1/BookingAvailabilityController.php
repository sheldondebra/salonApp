<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\Service;
use App\Services\BookingAvailabilityService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BookingAvailabilityController extends Controller
{
    public function __invoke(Request $request, BookingAvailabilityService $availability): JsonResponse
    {
        $validated = $request->validate([
            'date' => ['required', 'date', 'after_or_equal:today'],
            'service_ids' => ['required', 'array', 'min:1'],
            'service_ids.*' => ['integer', 'exists:services,id'],
            'staff_member_id' => ['nullable', 'integer', 'exists:staff_members,id'],
            'location_id' => ['nullable', 'integer', 'exists:locations,id'],
            'exclude_appointment_uuid' => ['nullable', 'uuid'],
        ]);

        $excludeId = null;
        if (! empty($validated['exclude_appointment_uuid'])) {
            $excludeId = Appointment::query()
                ->where('uuid', $validated['exclude_appointment_uuid'])
                ->value('id');
        }

        $duration = (int) Service::query()
            ->whereIn('id', $validated['service_ids'])
            ->whereBool('is_active')
            ->sum('duration_minutes');

        if ($duration < 1) {
            return response()->json(['data' => [], 'meta' => ['duration_minutes' => 0]]);
        }

        $slots = $availability->slotsForDay(
            $validated['date'],
            $duration,
            $validated['staff_member_id'] ?? null,
            $validated['location_id'] ?? null,
            $excludeId,
        );

        return response()->json([
            'data' => $slots,
            'meta' => [
                'duration_minutes' => $duration,
                'date' => $validated['date'],
                'has_availability' => collect($slots)->contains(fn ($s) => $s['available']),
            ],
        ]);
    }
}
