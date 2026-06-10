<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Client\UpdateProfileRequest;
use App\Http\Resources\AppointmentResource;
use App\Http\Resources\UserResource;
use App\Models\Appointment;
use App\Models\ClientFavorite;
use App\Models\Service;
use App\Models\StaffMember;
use App\Services\BookingService;
use App\Services\LoyaltyService;
use App\Services\NotificationService;
use App\Services\TenantClientDiscoveryService;
use App\Support\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ClientAccountController extends Controller
{
    public function __construct(
        protected LoyaltyService $loyalty,
        protected BookingService $booking,
        protected NotificationService $notifications,
        protected TenantClientDiscoveryService $discovery,
    ) {}

    public function tenants(Request $request): JsonResponse
    {
        $tenants = $request->user()
            ->tenants()
            ->orderBy('name')
            ->get(['tenants.id', 'tenants.name', 'tenants.slug', 'tenants.currency']);

        return response()->json([
            'data' => $tenants->map(fn ($tenant) => [
                'id' => $tenant->id,
                'name' => $tenant->name,
                'slug' => $tenant->slug,
                'currency' => $tenant->currency,
            ])->values(),
        ]);
    }

    public function updateProfile(UpdateProfileRequest $request): JsonResponse
    {
        $user = $request->user();
        $user->update($request->validated());

        return response()->json([
            'user' => new UserResource($user->fresh()),
            'message' => 'Profile updated',
        ]);
    }

    public function bookingHistory(Request $request): JsonResponse
    {
        $user = $request->user();
        $tenantId = TenantContext::id();

        $appointments = Appointment::withoutGlobalScope('tenant')
            ->where('tenant_id', $tenantId)
            ->where('client_user_id', $user->id)
            ->with(['service', 'staffMember'])
            ->orderByDesc('starts_at')
            ->paginate(15);

        return response()->json([
            'data' => AppointmentResource::collection($appointments),
            'meta' => [
                'current_page' => $appointments->currentPage(),
                'last_page' => $appointments->lastPage(),
                'total' => $appointments->total(),
            ],
        ]);
    }

    public function showBooking(Request $request, string $tenantSlug, string $uuid): JsonResponse
    {
        $appointment = $this->clientAppointment($request, $uuid);

        return response()->json(['data' => new AppointmentResource($appointment)]);
    }

    public function updateBooking(
        Request $request,
        string $tenantSlug,
        string $uuid,
    ): JsonResponse {
        $appointment = $this->clientAppointment($request, $uuid);

        if (in_array($appointment->status, ['cancelled', 'completed', 'no_show'], true)) {
            return response()->json(['message' => 'This appointment cannot be changed.'], 422);
        }

        $validated = $request->validate([
            'status' => ['sometimes', 'string', Rule::in(['cancelled'])],
            'starts_at' => ['sometimes', 'date', 'after:now'],
            'staff_member_id' => ['sometimes', 'nullable', 'integer', 'exists:staff_members,id'],
            'location_id' => ['sometimes', 'nullable', 'integer', 'exists:locations,id'],
        ]);

        $rescheduled = isset($validated['starts_at']);

        if ($rescheduled) {
            $appointment = $this->booking->rescheduleAppointment($appointment, [
                'starts_at' => $validated['starts_at'],
                'staff_member_id' => $validated['staff_member_id'] ?? $appointment->staff_member_id,
                'location_id' => $validated['location_id'] ?? $appointment->location_id,
            ]);
            unset($validated['starts_at'], $validated['staff_member_id'], $validated['location_id']);
        }

        $cancelled = ($validated['status'] ?? null) === 'cancelled';

        if ($validated !== []) {
            $appointment->update($validated);
            $appointment = $appointment->fresh(['service', 'staffMember', 'client', 'location']);
        }

        if ($cancelled) {
            $this->notifications->bookingCancelled($appointment);
        }

        return response()->json([
            'data' => new AppointmentResource($appointment),
            'message' => $rescheduled ? 'Appointment rescheduled' : ($cancelled ? 'Appointment cancelled' : 'Appointment updated'),
        ]);
    }

    protected function clientAppointment(Request $request, string $uuid): Appointment
    {
        return Appointment::withoutGlobalScope('tenant')
            ->where('tenant_id', TenantContext::id())
            ->where('client_user_id', $request->user()->id)
            ->where('uuid', $uuid)
            ->with(['service', 'staffMember', 'location'])
            ->firstOrFail();
    }

    public function favorites(Request $request): JsonResponse
    {
        $user = $request->user();
        $tenantId = TenantContext::id();

        $favorites = ClientFavorite::query()
            ->where('user_id', $user->id)
            ->where('tenant_id', $tenantId)
            ->get();

        $serviceIds = $favorites->where('favoritable_type', Service::class)->pluck('favoritable_id');
        $staffIds = $favorites->where('favoritable_type', StaffMember::class)->pluck('favoritable_id');

        return response()->json([
            'services' => Service::withoutGlobalScope('tenant')
                ->whereIn('id', $serviceIds)
                ->get(['id', 'uuid', 'name', 'duration_minutes', 'price_cents']),
            'staff' => StaffMember::withoutGlobalScope('tenant')
                ->whereIn('id', $staffIds)
                ->get(['id', 'uuid', 'display_name', 'title']),
        ]);
    }

    public function storeFavorite(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'type' => ['required', Rule::in(['service', 'staff'])],
            'id' => ['required', 'integer'],
        ]);

        $user = $request->user();
        $tenantId = TenantContext::id();

        $modelClass = $validated['type'] === 'service' ? Service::class : StaffMember::class;

        $exists = $modelClass::withoutGlobalScope('tenant')
            ->where('tenant_id', $tenantId)
            ->whereKey($validated['id'])
            ->exists();

        if (! $exists) {
            return response()->json(['message' => 'Item not found'], 404);
        }

        ClientFavorite::query()->firstOrCreate([
            'user_id' => $user->id,
            'tenant_id' => $tenantId,
            'favoritable_type' => $modelClass,
            'favoritable_id' => $validated['id'],
        ]);

        return response()->json(['message' => 'Added to favorites'], 201);
    }

    public function destroyFavorite(Request $request, string $type, int $id): JsonResponse
    {
        $modelClass = $type === 'service' ? Service::class : StaffMember::class;

        ClientFavorite::query()
            ->where('user_id', $request->user()->id)
            ->where('tenant_id', TenantContext::id())
            ->where('favoritable_type', $modelClass)
            ->where('favoritable_id', $id)
            ->delete();

        return response()->json(['message' => 'Removed from favorites']);
    }

    public function loyalty(Request $request): JsonResponse
    {
        $wallet = $this->loyalty->walletFor($request->user());
        $wallet->load(['transactions' => fn ($q) => $q->latest()->limit(20)]);

        return response()->json([
            'wallet' => [
                'points_balance' => $wallet->points_balance,
                'lifetime_points' => $wallet->lifetime_points,
            ],
            'transactions' => $wallet->transactions->map(fn ($t) => [
                'id' => $t->id,
                'points' => $t->points,
                'type' => $t->type,
                'description' => $t->description,
                'created_at' => $t->created_at?->toIso8601String(),
            ]),
        ]);
    }

    public function discovery(Request $request): JsonResponse
    {
        $tenantId = TenantContext::id();
        abort_unless($tenantId, 404);

        return response()->json(
            $this->discovery->feed($tenantId, $request->user())
        );
    }
}
