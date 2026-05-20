<?php

namespace App\Services;

use App\Models\Appointment;
use App\Support\TenantContext;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class BookingAvailabilityService
{
    public function __construct(
        protected StaffWorkingHoursService $staffWorkingHours,
    ) {}
    /**
     * @return list<array{time: string, label: string, available: bool}>
     */
    public function slotsForDay(
        string $date,
        int $totalDurationMinutes,
        ?int $staffMemberId = null,
        ?int $locationId = null,
        ?int $excludeAppointmentId = null,
    ): array {
        $day = Carbon::parse($date)->startOfDay();
        [$dayOpen, $dayClose] = $this->hoursForDay($day, $staffMemberId, $locationId);

        if ($dayOpen === null || $dayClose === null) {
            return [];
        }

        $start = $this->parseTimeOnDay($day, $dayOpen);
        $end = $this->parseTimeOnDay($day, $dayClose);
        $interval = config('booking.slot_interval_minutes', 15);

        $busy = $this->busyRanges($day, $staffMemberId, $locationId, $excludeAppointmentId);

        $slots = [];
        $cursor = $start->copy();

        while ($cursor->copy()->addMinutes($totalDurationMinutes)->lte($end)) {
            $slotEnd = $cursor->copy()->addMinutes($totalDurationMinutes);
            $available = ! $this->overlapsBusy($cursor, $slotEnd, $busy);

            $slots[] = [
                'time' => $cursor->format('H:i'),
                'label' => $cursor->format('g:i A'),
                'available' => $available,
            ];

            $cursor->addMinutes($interval);
        }

        return $slots;
    }

    public function slotIsAvailable(
        Carbon $startsAt,
        int $totalDurationMinutes,
        ?int $staffMemberId = null,
        ?int $locationId = null,
        ?int $excludeAppointmentId = null,
    ): bool {
        $endsAt = $startsAt->copy()->addMinutes($totalDurationMinutes);
        $busy = $this->busyRanges(
            $startsAt->copy()->startOfDay(),
            $staffMemberId,
            $locationId,
            $excludeAppointmentId,
        );

        return ! $this->overlapsBusy($startsAt, $endsAt, $busy);
    }

    /**
     * @return Collection<int, array{start: Carbon, end: Carbon}>
     */
    protected function busyRanges(
        Carbon $day,
        ?int $staffMemberId,
        ?int $locationId,
        ?int $excludeAppointmentId = null,
    ): Collection {
        $query = Appointment::query()
            ->whereDate('starts_at', $day)
            ->whereNotIn('status', ['cancelled', 'no_show']);

        if ($excludeAppointmentId) {
            $query->where('id', '!=', $excludeAppointmentId);
        }

        if ($staffMemberId) {
            $query->where('staff_member_id', $staffMemberId);
        }

        if ($locationId) {
            $query->where('location_id', $locationId);
        }

        return $query->get(['starts_at', 'ends_at'])->map(fn (Appointment $a) => [
            'start' => $a->starts_at,
            'end' => $a->ends_at,
        ]);
    }

    /**
     * @param  Collection<int, array{start: Carbon, end: Carbon}>  $busy
     */
    protected function overlapsBusy(Carbon $start, Carbon $end, Collection $busy): bool
    {
        foreach ($busy as $range) {
            if ($start->lt($range['end']) && $end->gt($range['start'])) {
                return true;
            }
        }

        return false;
    }

    protected function parseTimeOnDay(Carbon $day, string $time): Carbon
    {
        [$h, $m] = array_pad(explode(':', $time), 2, 0);

        return $day->copy()->setTime((int) $h, (int) $m, 0);
    }

    /**
     * @return array{0: ?string, 1: ?string} open and close times (H:i), or nulls when closed
     */
    /**
     * @return array{0: ?string, 1: ?string}
     */
    protected function hoursForDay(Carbon $day, ?int $staffMemberId = null, ?int $locationId = null): array
    {
        if ($staffMemberId) {
            $staffHours = $this->staffWorkingHours->hoursForStaffOnDay($staffMemberId, $day, $locationId);
            if ($staffHours !== null) {
                return $staffHours;
            }
        }

        $defaultStart = config('booking.hours.start', '09:00');
        $defaultEnd = config('booking.hours.end', '18:00');

        $tenant = TenantContext::get();
        $hours = $tenant?->setting('opening_hours', []);
        if (! is_array($hours) || $hours === []) {
            return [$defaultStart, $defaultEnd];
        }

        $dayKeys = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
        $key = $dayKeys[$day->dayOfWeekIso - 1] ?? 'mon';

        foreach ($hours as $row) {
            if (! is_array($row) || ($row['day'] ?? null) !== $key) {
                continue;
            }
            if (! empty($row['closed'])) {
                return [null, null];
            }

            return [
                (string) ($row['open'] ?? $defaultStart),
                (string) ($row['close'] ?? $defaultEnd),
            ];
        }

        return [$defaultStart, $defaultEnd];
    }
}
