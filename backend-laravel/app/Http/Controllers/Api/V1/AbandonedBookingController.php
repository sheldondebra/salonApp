<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\AbandonedBookingStatus;
use App\Http\Controllers\Api\V1\Concerns\ResolvesTenantFromRequest;
use App\Http\Controllers\Controller;
use App\Models\AbandonedBookingSession;
use App\Services\AbandonedBookingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AbandonedBookingController extends Controller
{
    use ResolvesTenantFromRequest;

    public function __construct(
        private readonly AbandonedBookingService $abandoned,
    ) {}

    public function index(Request $request, string $tenantSlug): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);
        $filters = $request->validate([
            'status' => ['nullable', Rule::in(AbandonedBookingStatus::values())],
            'source' => ['nullable', 'string', 'max:64'],
            'q' => ['nullable', 'string', 'max:100'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        $paginator = $this->abandoned->paginate($tenant->id, $filters, (int) ($filters['per_page'] ?? 20));

        return response()->json([
            'data' => collect($paginator->items())->map(fn (AbandonedBookingSession $session) => $this->abandoned->formatSession($session))->values(),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }

    public function store(Request $request, string $tenantSlug): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);
        $data = $request->validate([
            'client_email' => ['nullable', 'email', 'max:255'],
            'client_phone' => ['nullable', 'string', 'max:50'],
            'client_name' => ['nullable', 'string', 'max:255'],
            'draft' => ['nullable', 'array'],
            'status' => ['nullable', Rule::in(AbandonedBookingStatus::values())],
            'last_activity_at' => ['nullable', 'date'],
            'source' => ['nullable', 'string', 'max:64'],
        ]);

        $session = $this->abandoned->create($tenant->id, $data);

        return response()->json(['data' => $this->abandoned->formatSession($session)], 201);
    }

    public function update(Request $request, string $tenantSlug, AbandonedBookingSession $abandonedBookingSession): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);
        abort_unless($abandonedBookingSession->tenant_id === $tenant->id, 404);

        $data = $request->validate([
            'client_email' => ['nullable', 'email', 'max:255'],
            'client_phone' => ['nullable', 'string', 'max:50'],
            'client_name' => ['nullable', 'string', 'max:255'],
            'draft' => ['nullable', 'array'],
            'status' => ['nullable', Rule::in(AbandonedBookingStatus::values())],
            'last_activity_at' => ['nullable', 'date'],
            'recovered_appointment_id' => ['nullable', 'integer', 'exists:appointments,id'],
            'source' => ['nullable', 'string', 'max:64'],
        ]);

        $session = $this->abandoned->update($abandonedBookingSession, $data);

        return response()->json(['data' => $this->abandoned->formatSession($session)]);
    }

    public function destroy(Request $request, string $tenantSlug, AbandonedBookingSession $abandonedBookingSession): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);
        abort_unless($abandonedBookingSession->tenant_id === $tenant->id, 404);

        $this->abandoned->delete($abandonedBookingSession);

        return response()->json(['message' => 'Abandoned booking deleted']);
    }

    public function sendReminder(Request $request, string $tenantSlug, AbandonedBookingSession $abandonedBookingSession): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);
        abort_unless($abandonedBookingSession->tenant_id === $tenant->id, 404);

        return response()->json([
            'data' => $this->abandoned->sendReminderPlaceholder($abandonedBookingSession),
        ]);
    }

    public function analytics(Request $request, string $tenantSlug): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);

        return response()->json([
            'data' => $this->abandoned->analytics($tenant->id),
        ]);
    }
}
