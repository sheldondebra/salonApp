<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Bookings\StoreAppointmentRequest;
use App\Http\Resources\AppointmentResource;
use App\Models\Appointment;
use App\Models\Service;
use App\Models\User;
use App\Services\LoyaltyService;
use App\Support\TenantContext;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AppointmentController extends Controller
{
    public function index(): JsonResponse
    {
        $this->authorize('viewAny', Appointment::class);

        $appointments = Appointment::query()
            ->with(['service', 'staffMember', 'client'])
            ->orderByDesc('starts_at')
            ->paginate(20);

        return response()->json([
            'data' => AppointmentResource::collection($appointments),
            'meta' => [
                'current_page' => $appointments->currentPage(),
                'last_page' => $appointments->lastPage(),
                'total' => $appointments->total(),
            ],
        ]);
    }

    public function store(StoreAppointmentRequest $request): JsonResponse
    {
        if ($request->user()) {
            $this->authorize('create', Appointment::class);
        }

        $service = Service::query()->findOrFail($request->validated('service_id'));
        $startsAt = Carbon::parse($request->validated('starts_at'));
        $endsAt = $startsAt->copy()->addMinutes($service->duration_minutes);

        $clientUserId = $request->user()?->id;

        if (! $clientUserId && $request->filled('client_email')) {
            $client = User::query()->firstOrCreate(
                ['email' => $request->input('client_email')],
                [
                    'name' => $request->input('client_name'),
                    'phone' => $request->input('client_phone'),
                    'password' => Hash::make(Str::random(32)),
                    'user_type' => 'client',
                    'is_active' => true,
                ]
            );
            $clientUserId = $client->id;

            $tenant = TenantContext::get();
            if ($tenant && ! $client->tenants()->where('tenants.id', $tenant->id)->exists()) {
                $client->tenants()->attach($tenant->id, ['joined_at' => now()]);
            }
        }

        $appointment = Appointment::query()->create([
            'client_user_id' => $clientUserId,
            'staff_member_id' => $request->input('staff_member_id'),
            'service_id' => $service->id,
            'location_id' => $request->input('location_id'),
            'starts_at' => $startsAt,
            'ends_at' => $endsAt,
            'status' => 'pending',
            'notes' => $request->input('notes'),
        ]);

        $appointment->load(['service', 'staffMember', 'client']);

        app(LoyaltyService::class)->awardForAppointment($appointment);

        return response()->json([
            'data' => new AppointmentResource($appointment),
            'message' => 'Appointment booked successfully',
        ], 201);
    }
}
