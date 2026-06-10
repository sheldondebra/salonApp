<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\V1\Concerns\ResolvesTenantFromRequest;
use App\Http\Controllers\Controller;
use App\Models\BookingWaitlistEntry;
use App\Services\WaitlistService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class TenantWaitlistController extends Controller
{
    use ResolvesTenantFromRequest;

    public function __construct(private readonly WaitlistService $waitlist) {}

    public function index(Request $request, string $tenantSlug): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);

        $filters = $request->validate([
            'status' => ['nullable', 'string', Rule::in(['all', 'waiting', 'notified', 'booked', 'cancelled'])],
            'preferred_date' => ['nullable', 'date'],
            'staff_member_id' => ['nullable', 'integer'],
            'location_id' => ['nullable', 'integer'],
            'q' => ['nullable', 'string', 'max:100'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        $paginator = $this->waitlist->paginate(
            $tenant->id,
            $filters,
            (int) ($filters['per_page'] ?? 20),
        );

        return response()->json([
            'data' => collect($paginator->items())->map(fn (BookingWaitlistEntry $e) => $this->waitlist->formatEntry($e)),
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
        $maxParty = config('booking.max_party_size', 10);

        $data = $request->validate([
            'service_ids' => ['required', 'array', 'min:1'],
            'service_ids.*' => ['integer', 'exists:services,id'],
            'staff_member_id' => ['nullable', 'integer', 'exists:staff_members,id'],
            'location_id' => ['nullable', 'integer', 'exists:locations,id'],
            'preferred_date' => ['required', 'date', 'after_or_equal:today'],
            'preferred_time' => ['nullable', 'date_format:H:i'],
            'party_size' => ['nullable', 'integer', 'min:1', 'max:'.$maxParty],
            'priority' => ['nullable', 'integer', 'min:0', 'max:999'],
            'client_user_id' => ['nullable', 'integer', 'exists:users,id'],
            'client_name' => ['required_without:client_user_id', 'string', 'max:255'],
            'client_email' => ['required_without:client_user_id', 'email', 'max:255'],
            'client_phone' => ['nullable', 'string', 'max:30'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $entry = $this->waitlist->createStaffEntry($data, $request->user());

        return response()->json(['data' => $this->waitlist->formatEntry($entry)], 201);
    }

    public function show(Request $request, string $tenantSlug, BookingWaitlistEntry $waitlistEntry): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);
        abort_unless($waitlistEntry->tenant_id === $tenant->id, 404);

        return response()->json(['data' => $this->waitlist->formatEntry($waitlistEntry)]);
    }

    public function update(Request $request, string $tenantSlug, BookingWaitlistEntry $waitlistEntry): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);
        abort_unless($waitlistEntry->tenant_id === $tenant->id, 404);

        $maxParty = config('booking.max_party_size', 10);

        $data = $request->validate([
            'service_ids' => ['sometimes', 'array', 'min:1'],
            'service_ids.*' => ['integer', 'exists:services,id'],
            'staff_member_id' => ['nullable', 'integer', 'exists:staff_members,id'],
            'location_id' => ['nullable', 'integer', 'exists:locations,id'],
            'preferred_date' => ['sometimes', 'date', 'after_or_equal:today'],
            'preferred_time' => ['nullable', 'date_format:H:i'],
            'party_size' => ['nullable', 'integer', 'min:1', 'max:'.$maxParty],
            'priority' => ['nullable', 'integer', 'min:0', 'max:999'],
            'client_name' => ['sometimes', 'string', 'max:255'],
            'client_email' => ['sometimes', 'email', 'max:255'],
            'client_phone' => ['nullable', 'string', 'max:30'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'status' => ['sometimes', 'string', Rule::in(['waiting', 'notified', 'cancelled'])],
        ]);

        $entry = $this->waitlist->updateEntry($waitlistEntry, $data);

        return response()->json(['data' => $this->waitlist->formatEntry($entry)]);
    }

    public function destroy(Request $request, string $tenantSlug, BookingWaitlistEntry $waitlistEntry): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);
        abort_unless($waitlistEntry->tenant_id === $tenant->id, 404);

        $entry = $this->waitlist->cancel($waitlistEntry);

        return response()->json(['data' => $this->waitlist->formatEntry($entry)]);
    }

    public function openings(Request $request, string $tenantSlug, BookingWaitlistEntry $waitlistEntry): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);
        abort_unless($waitlistEntry->tenant_id === $tenant->id, 404);

        $openings = $this->waitlist->findOpenings($waitlistEntry);

        return response()->json(['data' => $openings]);
    }

    public function notify(Request $request, string $tenantSlug, BookingWaitlistEntry $waitlistEntry): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);
        abort_unless($waitlistEntry->tenant_id === $tenant->id, 404);

        $entry = $this->waitlist->notifyClient($waitlistEntry, $request->user());

        return response()->json([
            'data' => $this->waitlist->formatEntry($entry),
            'message' => 'Client marked as notified. SMS/email delivery will be wired in a later release.',
        ]);
    }

    public function convert(Request $request, string $tenantSlug, BookingWaitlistEntry $waitlistEntry): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);
        abort_unless($waitlistEntry->tenant_id === $tenant->id, 404);

        $data = $request->validate([
            'starts_at' => ['required', 'date'],
            'staff_member_id' => ['nullable', 'integer', 'exists:staff_members,id'],
        ]);

        try {
            $result = $this->waitlist->convertToBooking(
                $waitlistEntry,
                $data['starts_at'],
                $data['staff_member_id'] ?? null,
                $request->user(),
            );
        } catch (ValidationException $e) {
            throw $e;
        }

        return response()->json([
            'data' => [
                'entry' => $this->waitlist->formatEntry($result['entry']),
                'appointment' => $result['appointment'],
            ],
            'message' => 'Waitlist entry converted to booking.',
        ]);
    }
}
