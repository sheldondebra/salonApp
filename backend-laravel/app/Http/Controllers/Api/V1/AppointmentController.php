<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Bookings\StoreBookingRequest;
use App\Http\Requests\Bookings\UpdateAppointmentRequest;
use App\Http\Resources\AppointmentResource;
use App\Http\Resources\BookingGroupResource;
use App\Models\Appointment;
use App\Services\BookingService;
use App\Services\NotificationService;
use App\Support\TenantContext;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AppointmentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Appointment::class);

        $tenantId = TenantContext::id();
        $filter = $request->string('filter', 'upcoming')->toString();
        $today = Carbon::today();

        $query = Appointment::query()
            ->with(['service', 'staffMember', 'client', 'location', 'bookingGroup']);

        match ($filter) {
            'today' => $query->whereDate('starts_at', $today),
            'upcoming' => $query
                ->where('starts_at', '>=', now())
                ->whereNotIn('status', ['cancelled', 'no_show']),
            'past' => $query->where('ends_at', '<', now()),
            'all' => null,
            default => null,
        };

        if ($request->filled('status')) {
            $query->where('status', $request->string('status')->toString());
        }

        if ($request->filled('staff_id')) {
            $query->where('staff_member_id', $request->integer('staff_id'));
        }

        if ($request->filled('q')) {
            $term = '%'.$request->string('q')->toString().'%';
            $query->where(function ($q) use ($term) {
                $q->whereHas('client', function ($c) use ($term) {
                    $c->where('name', 'like', $term)->orWhere('email', 'like', $term);
                })->orWhereHas('service', function ($s) use ($term) {
                    $s->where('name', 'like', $term);
                })->orWhereHas('staffMember', function ($s) use ($term) {
                    $s->where('display_name', 'like', $term);
                });
            });
        }

        $ascending = in_array($filter, ['today', 'upcoming'], true);
        $appointments = $query
            ->orderBy('starts_at', $ascending ? 'asc' : 'desc')
            ->paginate(min($request->integer('per_page', 30), 100));

        $base = Appointment::withoutGlobalScope('tenant')->where('tenant_id', $tenantId);

        return response()->json([
            'data' => AppointmentResource::collection($appointments),
            'meta' => [
                'current_page' => $appointments->currentPage(),
                'last_page' => $appointments->lastPage(),
                'total' => $appointments->total(),
                'filter' => $filter,
                'summary' => [
                    'today' => (clone $base)->whereDate('starts_at', $today)->count(),
                    'pending' => (clone $base)->where('status', 'pending')->count(),
                    'upcoming' => (clone $base)
                        ->where('starts_at', '>=', now())
                        ->whereNotIn('status', ['cancelled', 'no_show', 'completed'])
                        ->count(),
                ],
            ],
        ]);
    }

    public function show(string $tenantSlug, string $uuid): JsonResponse
    {
        $appointment = Appointment::query()
            ->where('uuid', $uuid)
            ->with(['service', 'staffMember', 'client', 'location', 'bookingGroup'])
            ->firstOrFail();

        $this->authorize('view', $appointment);

        return response()->json([
            'data' => new AppointmentResource($appointment),
        ]);
    }

    public function update(
        UpdateAppointmentRequest $request,
        string $tenantSlug,
        string $uuid,
        BookingService $booking,
        NotificationService $notifications,
    ): JsonResponse {
        $appointment = Appointment::query()->where('uuid', $uuid)->firstOrFail();

        $this->authorize('update', $appointment);

        $validated = $request->validated();
        $rescheduled = isset($validated['starts_at']);

        if ($rescheduled) {
            $appointment = $booking->rescheduleAppointment($appointment, [
                'starts_at' => $validated['starts_at'],
                'staff_member_id' => $validated['staff_member_id'] ?? $appointment->staff_member_id,
                'location_id' => $validated['location_id'] ?? $appointment->location_id,
            ]);
            unset($validated['starts_at'], $validated['staff_member_id'], $validated['location_id']);
        }

        $cancelled = ($validated['status'] ?? null) === 'cancelled';

        if ($validated !== []) {
            $appointment->update($validated);
            $appointment = $appointment->fresh(['service', 'staffMember', 'client', 'location', 'bookingGroup', 'tenant']);
        }

        if ($cancelled) {
            $notifications->bookingCancelled($appointment);
        }

        $message = $rescheduled ? 'Appointment rescheduled' : 'Appointment updated';

        return response()->json([
            'data' => new AppointmentResource($appointment),
            'message' => $message,
        ]);
    }

    public function store(
        StoreBookingRequest $request,
        BookingService $booking,
        NotificationService $notifications,
    ): JsonResponse {
        $bookedVia = 'online';
        if ($request->user()) {
            if ($request->user()->can('create', Appointment::class)) {
                $this->authorize('create', Appointment::class);
                $bookedVia = 'staff';
            }
        }

        $result = $booking->createBooking([
            ...$request->validated(),
            'client_user_id' => $request->validated('client_user_id') ?? $request->user()?->id,
            'booked_via' => $bookedVia,
        ]);

        $first = $result['appointments']->first();
        if ($first) {
            $first->loadMissing('tenant');
            $notifications->bookingConfirmed($first);
        }

        return response()->json([
            'data' => new BookingGroupResource($result['group']),
            'appointments' => AppointmentResource::collection($result['appointments']),
            'message' => 'Appointment booked successfully',
        ], 201);
    }
}
