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
use App\Services\LoyaltyService;
use App\Support\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ClientAccountController extends Controller
{
    public function __construct(
        protected LoyaltyService $loyalty,
    ) {}

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
}
