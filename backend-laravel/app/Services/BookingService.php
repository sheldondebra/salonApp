<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\BookingGroup;
use App\Models\BookingWaitlistEntry;
use App\Models\Service;
use App\Models\User;
use App\Support\TenantContext;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class BookingService
{
    public function __construct(
        protected BookingAvailabilityService $availability,
        protected LoyaltyService $loyalty,
        protected StaffServiceAssignmentService $staffAssignments,
    ) {}

    /**
     * @param  array{
     *   service_ids: list<int>,
     *   staff_member_id?: int|null,
     *   location_id?: int|null,
     *   starts_at: string,
     *   party_size?: int,
     *   recurrence?: array{frequency: string, occurrences: int}|null,
     *   notes?: string|null,
     *   client_name?: string,
     *   client_email?: string,
     *   client_phone?: string|null,
     *   client_user_id?: int|null,
     *   booked_via?: 'online'|'staff',
     * }  $data
     * @return array{group: BookingGroup, appointments: Collection<int, Appointment>}
     */
    public function createBooking(array $data): array
    {
        $services = Service::query()
            ->whereIn('id', $data['service_ids'])
            ->whereBool('is_active')
            ->orderBy('name')
            ->get();

        if ($services->isEmpty()) {
            throw ValidationException::withMessages([
                'service_ids' => ['Select at least one service.'],
            ]);
        }

        $this->staffAssignments->assertStaffCanPerformServices(
            $data['staff_member_id'] ?? null,
            $services->pluck('id')->all(),
        );

        $partySize = min(
            (int) ($data['party_size'] ?? 1),
            config('booking.max_party_size', 10)
        );

        $bookingType = 'standard';
        if ($partySize > 1) {
            $bookingType = 'group';
        }
        if (! empty($data['recurrence']['occurrences']) && ($data['recurrence']['occurrences'] ?? 0) > 1) {
            $bookingType = 'recurring';
        }

        $clientUserId = $this->resolveClientId($data);
        $startsAt = Carbon::parse($data['starts_at']);
        $totalMinutes = (int) $services->sum('duration_minutes');

        $occurrenceCount = 1;
        $recurrence = $data['recurrence'] ?? null;
        if ($recurrence && ($recurrence['occurrences'] ?? 1) > 1) {
            $occurrenceCount = min(
                (int) $recurrence['occurrences'],
                config('booking.max_recurring_occurrences', 12)
            );
        }

        return DB::transaction(function () use (
            $data,
            $services,
            $partySize,
            $bookingType,
            $clientUserId,
            $startsAt,
            $recurrence,
            $occurrenceCount,
            $totalMinutes,
        ) {
            $allAppointments = collect();
            $primaryGroup = null;

            for ($i = 0; $i < $occurrenceCount; $i++) {
                $occurrenceStart = $startsAt->copy();
                if ($i > 0) {
                    $occurrenceStart = $this->nextRecurrence($startsAt, $recurrence, $i);
                }

                if (! $this->availability->slotIsAvailable(
                    $occurrenceStart,
                    $totalMinutes,
                    $data['staff_member_id'] ?? null,
                    $data['location_id'] ?? null,
                    null,
                    $services->pluck('id')->all(),
                )) {
                    throw ValidationException::withMessages([
                        'starts_at' => ['This time slot is no longer available. Join the waitlist or pick another time.'],
                    ]);
                }

                $group = BookingGroup::query()->create([
                    'client_user_id' => $clientUserId,
                    'location_id' => $data['location_id'] ?? null,
                    'party_size' => $partySize,
                    'booking_type' => $bookingType,
                    'recurrence' => $i === 0 ? $recurrence : null,
                    'notes' => $data['notes'] ?? null,
                ]);

                $cursor = $occurrenceStart->copy();
                foreach ($services as $service) {
                    $endsAt = $cursor->copy()->addMinutes($service->duration_minutes);

                    $tenant = TenantContext::get();
                    $priceCents = (int) $service->price_cents;
                    $paymentFields = $tenant?->paymentsEnabled()
                        ? [
                            'amount_due_cents' => $priceCents,
                            'payment_status' => 'unpaid',
                        ]
                        : [];

                    $appointment = Appointment::query()->create([
                        'booking_group_id' => $group->id,
                        'client_user_id' => $clientUserId,
                        'staff_member_id' => $data['staff_member_id'] ?? null,
                        'service_id' => $service->id,
                        'location_id' => $data['location_id'] ?? null,
                        'starts_at' => $cursor,
                        'ends_at' => $endsAt,
                        'status' => 'pending',
                        'booked_via' => $data['booked_via'] ?? 'staff',
                        'notes' => $partySize > 1
                            ? trim(($data['notes'] ?? '').' Group booking · '.$partySize.' guests')
                            : ($data['notes'] ?? null),
                        ...$paymentFields,
                    ]);

                    $appointment->load(['service', 'staffMember', 'client', 'location']);
                    $this->loyalty->awardForAppointment($appointment);
                    $allAppointments->push($appointment);
                    $cursor = $endsAt;
                }

                if ($i === 0) {
                    $primaryGroup = $group;
                }
            }

            $primaryGroup->load('appointments.service', 'appointments.staffMember', 'location');

            return [
                'group' => $primaryGroup,
                'appointments' => $allAppointments,
            ];
        });
    }

    /**
     * Reschedule a single appointment to a new start time (validates availability).
     *
     * @param  array{starts_at: string, staff_member_id?: int|null, location_id?: int|null}  $data
     */
    public function rescheduleAppointment(Appointment $appointment, array $data): Appointment
    {
        if (in_array($appointment->status, ['cancelled', 'completed', 'no_show'], true)) {
            throw ValidationException::withMessages([
                'starts_at' => ['This appointment cannot be rescheduled.'],
            ]);
        }

        $appointment->loadMissing('service');
        $duration = (int) ($appointment->service?->duration_minutes ?? 60);
        $startsAt = Carbon::parse($data['starts_at']);
        $staffMemberId = array_key_exists('staff_member_id', $data)
            ? $data['staff_member_id']
            : $appointment->staff_member_id;

        if ($appointment->service_id) {
            $this->staffAssignments->assertStaffCanPerformServices(
                $staffMemberId,
                [$appointment->service_id],
            );
        }
        $locationId = array_key_exists('location_id', $data)
            ? $data['location_id']
            : $appointment->location_id;

        return DB::transaction(function () use ($appointment, $data, $duration, $startsAt, $staffMemberId, $locationId) {
            if (! $this->availability->slotIsAvailable(
                $startsAt,
                $duration,
                $staffMemberId,
                $locationId,
                $appointment->id,
                $appointment->service_id ? [$appointment->service_id] : [],
            )) {
                throw ValidationException::withMessages([
                    'starts_at' => ['This time slot is no longer available. Choose another time.'],
                ]);
            }

            $appointment->update([
                'starts_at' => $startsAt,
                'ends_at' => $startsAt->copy()->addMinutes($duration),
                'staff_member_id' => $staffMemberId,
                'location_id' => $locationId,
                'status' => $appointment->status === 'pending' ? 'pending' : 'confirmed',
            ]);

            return $appointment->fresh(['service', 'staffMember', 'client', 'location', 'bookingGroup']);
        });
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function createWaitlistEntry(array $data): BookingWaitlistEntry
    {
        $clientUserId = $this->resolveClientId($data);

        return BookingWaitlistEntry::query()->create([
            'client_user_id' => $clientUserId,
            'client_name' => $data['client_name'] ?? 'Guest',
            'client_email' => $data['client_email'],
            'client_phone' => $data['client_phone'] ?? null,
            'location_id' => $data['location_id'] ?? null,
            'staff_member_id' => $data['staff_member_id'] ?? null,
            'service_ids' => $data['service_ids'],
            'preferred_date' => $data['preferred_date'],
            'preferred_time' => $data['preferred_time'] ?? null,
            'party_size' => min((int) ($data['party_size'] ?? 1), config('booking.max_party_size', 10)),
            'status' => 'waiting',
            'notes' => $data['notes'] ?? null,
        ]);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    protected function resolveClientId(array $data): ?int
    {
        if (! empty($data['client_user_id'])) {
            return (int) $data['client_user_id'];
        }

        if (empty($data['client_email'])) {
            return null;
        }

        $client = User::query()->firstOrCreate(
            ['email' => $data['client_email']],
            [
                'name' => $data['client_name'] ?? 'Guest',
                'phone' => $data['client_phone'] ?? null,
                'password' => Hash::make(Str::random(32)),
                'user_type' => 'client',
            ]
        );

        $tenant = TenantContext::get();
        if ($tenant && ! $client->tenants()->where('tenants.id', $tenant->id)->exists()) {
            $client->tenants()->attach($tenant->id, ['joined_at' => now()]);
        }

        return $client->id;
    }

    protected function nextRecurrence(Carbon $base, ?array $recurrence, int $index): Carbon
    {
        $frequency = $recurrence['frequency'] ?? 'weekly';
        $weeks = match ($frequency) {
            'biweekly' => 2 * $index,
            'monthly' => null,
            default => $index,
        };

        if ($frequency === 'monthly') {
            return $base->copy()->addMonths($index);
        }

        return $base->copy()->addWeeks($weeks);
    }
}
