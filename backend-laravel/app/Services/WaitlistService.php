<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\BookingWaitlistEntry;
use App\Models\Service;
use App\Models\User;
use App\Support\TenantContext;
use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Validation\ValidationException;

class WaitlistService
{
    public function __construct(
        protected BookingService $booking,
        protected BookingAvailabilityService $availability,
    ) {}

    /**
     * @param  array<string, mixed>  $filters
     */
    public function paginate(int $tenantId, array $filters = [], int $perPage = 20): LengthAwarePaginator
    {
        $query = BookingWaitlistEntry::query()
            ->where('tenant_id', $tenantId)
            ->with(['client:id,name,email,phone', 'location:id,name', 'staffMember:id,display_name', 'convertedAppointment:id,uuid,starts_at'])
            ->orderByDesc('priority')
            ->orderBy('preferred_date')
            ->orderBy('preferred_time')
            ->orderByDesc('created_at');

        if (! empty($filters['status']) && $filters['status'] !== 'all') {
            $query->where('status', $filters['status']);
        }

        if (! empty($filters['preferred_date'])) {
            $query->whereDate('preferred_date', $filters['preferred_date']);
        }

        if (! empty($filters['staff_member_id'])) {
            $query->where('staff_member_id', (int) $filters['staff_member_id']);
        }

        if (! empty($filters['location_id'])) {
            $query->where('location_id', (int) $filters['location_id']);
        }

        if (! empty($filters['q'])) {
            $term = '%'.$filters['q'].'%';
            $query->where(function ($q) use ($term) {
                $q->where('client_name', 'like', $term)
                    ->orWhere('client_email', 'like', $term)
                    ->orWhere('client_phone', 'like', $term);
            });
        }

        return $query->paginate(min($perPage, 50));
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function createStaffEntry(array $data, ?User $actor = null): BookingWaitlistEntry
    {
        $entry = $this->booking->createWaitlistEntry([
            ...$data,
            'client_user_id' => $data['client_user_id'] ?? null,
        ]);

        if ($actor) {
            $entry->update(['created_by_user_id' => $actor->id]);
        }

        if (isset($data['priority'])) {
            $entry->update(['priority' => max(0, min(999, (int) $data['priority']))]);
        }

        return $entry->fresh(['client', 'location', 'staffMember']);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function updateEntry(BookingWaitlistEntry $entry, array $data): BookingWaitlistEntry
    {
        if (in_array($entry->status, ['booked', 'cancelled'], true)) {
            throw ValidationException::withMessages([
                'status' => ['This waitlist entry can no longer be edited.'],
            ]);
        }

        $fillable = array_filter([
            'client_name' => $data['client_name'] ?? null,
            'client_email' => $data['client_email'] ?? null,
            'client_phone' => $data['client_phone'] ?? null,
            'location_id' => array_key_exists('location_id', $data) ? $data['location_id'] : null,
            'staff_member_id' => array_key_exists('staff_member_id', $data) ? $data['staff_member_id'] : null,
            'service_ids' => $data['service_ids'] ?? null,
            'preferred_date' => $data['preferred_date'] ?? null,
            'preferred_time' => array_key_exists('preferred_time', $data) ? $data['preferred_time'] : null,
            'party_size' => $data['party_size'] ?? null,
            'priority' => isset($data['priority']) ? max(0, min(999, (int) $data['priority'])) : null,
            'status' => $data['status'] ?? null,
            'notes' => array_key_exists('notes', $data) ? $data['notes'] : null,
        ], fn ($v) => $v !== null);

        $entry->update($fillable);

        return $entry->fresh(['client', 'location', 'staffMember', 'convertedAppointment']);
    }

    public function cancel(BookingWaitlistEntry $entry): BookingWaitlistEntry
    {
        if ($entry->status === 'booked') {
            throw ValidationException::withMessages([
                'status' => ['This entry was already converted to a booking.'],
            ]);
        }

        $entry->update(['status' => 'cancelled']);

        return $entry->fresh();
    }

    /**
     * @return list<array{date: string, time: string, label: string, staff_member_id: ?int}>
     */
    public function findOpenings(BookingWaitlistEntry $entry, int $daySpan = 7): array
    {
        if (in_array($entry->status, ['booked', 'cancelled'], true)) {
            return [];
        }

        $serviceIds = array_values(array_map('intval', $entry->service_ids ?? []));
        if ($serviceIds === []) {
            return [];
        }

        $duration = (int) Service::query()
            ->whereIn('id', $serviceIds)
            ->whereBool('is_active')
            ->sum('duration_minutes');

        if ($duration <= 0) {
            return [];
        }

        $openings = [];
        $startDay = Carbon::parse($entry->preferred_date)->startOfDay();
        $today = Carbon::today();

        for ($offset = 0; $offset < $daySpan; $offset++) {
            $day = $startDay->copy()->addDays($offset);
            if ($day->lt($today)) {
                continue;
            }

            $dateStr = $day->toDateString();
            $slots = $this->availability->slotsForDay(
                $dateStr,
                $duration,
                $entry->staff_member_id,
                $entry->location_id,
                null,
                false,
                $serviceIds,
            );

            foreach ($slots as $slot) {
                if (! $slot['available']) {
                    continue;
                }

                $openings[] = [
                    'date' => $dateStr,
                    'time' => $slot['time'],
                    'label' => $slot['label'],
                    'staff_member_id' => $entry->staff_member_id,
                ];
            }
        }

        if ($entry->preferred_time) {
            usort($openings, function (array $a, array $b) use ($entry) {
                $pref = $entry->preferred_time;
                $da = abs(strtotime($a['time']) - strtotime($pref));
                $db = abs(strtotime($b['time']) - strtotime($pref));
                if ($da !== $db) {
                    return $da <=> $db;
                }

                return strcmp($a['date'], $b['date']);
            });
        }

        return array_slice($openings, 0, 20);
    }

    public function notifyClient(BookingWaitlistEntry $entry, ?User $actor = null): BookingWaitlistEntry
    {
        if (in_array($entry->status, ['booked', 'cancelled'], true)) {
            throw ValidationException::withMessages([
                'status' => ['Cannot notify a closed waitlist entry.'],
            ]);
        }

        $entry->update([
            'notified_at' => now(),
            'status' => $entry->status === 'waiting' ? 'notified' : $entry->status,
        ]);

        return $entry->fresh(['client', 'location', 'staffMember']);
    }

    /**
     * @return array{entry: BookingWaitlistEntry, appointment: Appointment, group: mixed}
     */
    public function convertToBooking(
        BookingWaitlistEntry $entry,
        string $startsAt,
        ?int $staffMemberId = null,
        ?User $actor = null,
    ): array {
        if (in_array($entry->status, ['booked', 'cancelled'], true)) {
            throw ValidationException::withMessages([
                'status' => ['This waitlist entry is already closed.'],
            ]);
        }

        $staffId = $staffMemberId ?? $entry->staff_member_id;
        $serviceIds = array_values(array_map('intval', $entry->service_ids ?? []));

        $duration = (int) Service::query()->whereIn('id', $serviceIds)->sum('duration_minutes');
        $start = Carbon::parse($startsAt);

        if (! $this->availability->slotIsAvailable(
            $start,
            $duration,
            $staffId,
            $entry->location_id,
            null,
            $serviceIds,
        )) {
            throw ValidationException::withMessages([
                'starts_at' => ['That slot is no longer available. Pick another opening.'],
            ]);
        }

        $result = $this->booking->createBooking([
            'service_ids' => $serviceIds,
            'staff_member_id' => $staffId,
            'location_id' => $entry->location_id,
            'starts_at' => $start->toIso8601String(),
            'party_size' => $entry->party_size,
            'client_user_id' => $entry->client_user_id,
            'client_name' => $entry->client_name,
            'client_email' => $entry->client_email,
            'client_phone' => $entry->client_phone,
            'notes' => $entry->notes,
            'booked_via' => 'staff',
        ]);

        /** @var Appointment $appointment */
        $appointment = $result['appointments']->first();

        $entry->update([
            'status' => 'booked',
            'converted_appointment_id' => $appointment->id,
        ]);

        return [
            'entry' => $entry->fresh(['client', 'location', 'staffMember', 'convertedAppointment']),
            'appointment' => $appointment->load(['service', 'staffMember', 'client', 'location']),
            'group' => $result['group'],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function formatEntry(BookingWaitlistEntry $entry): array
    {
        $entry->loadMissing(['client:id,name,email,phone', 'location:id,name', 'staffMember:id,display_name', 'convertedAppointment:id,uuid,starts_at,status']);

        $services = Service::query()
            ->whereIn('id', $entry->service_ids ?? [])
            ->get(['id', 'name', 'duration_minutes', 'price_cents']);

        return [
            'uuid' => $entry->uuid,
            'status' => $entry->status,
            'priority' => (int) $entry->priority,
            'client_user_id' => $entry->client_user_id,
            'client_name' => $entry->client_name,
            'client_email' => $entry->client_email,
            'client_phone' => $entry->client_phone,
            'location_id' => $entry->location_id,
            'staff_member_id' => $entry->staff_member_id,
            'service_ids' => $entry->service_ids ?? [],
            'preferred_date' => $entry->preferred_date?->toDateString(),
            'preferred_time' => $entry->preferred_time,
            'party_size' => (int) $entry->party_size,
            'notes' => $entry->notes,
            'notified_at' => $entry->notified_at?->toIso8601String(),
            'created_at' => $entry->created_at?->toIso8601String(),
            'client' => $entry->client,
            'location' => $entry->location,
            'staff_member' => $entry->staffMember ? [
                'id' => $entry->staffMember->id,
                'name' => $entry->staffMember->display_name,
            ] : null,
            'services' => $services,
            'converted_appointment' => $entry->convertedAppointment ? [
                'uuid' => $entry->convertedAppointment->uuid,
                'starts_at' => $entry->convertedAppointment->starts_at?->toIso8601String(),
                'status' => $entry->convertedAppointment->status,
            ] : null,
        ];
    }
}
