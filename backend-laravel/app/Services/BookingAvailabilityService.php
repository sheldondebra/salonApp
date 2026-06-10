<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\StaffMember;
use App\Support\TenantContext;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class BookingAvailabilityService
{
    public function __construct(
        protected StaffWorkingHoursService $staffWorkingHours,
        protected StaffBreakService $staffBreaks,
        protected StaffTimeOffService $staffTimeOff,
        protected StaffServiceAssignmentService $staffAssignments,
    ) {}

    /**
     * @return list<array{time: string, label: string, available: bool, reason?: string}>
     */
    public function slotsForDay(
        string $date,
        int $totalDurationMinutes,
        ?int $staffMemberId = null,
        ?int $locationId = null,
        ?int $excludeAppointmentId = null,
        bool $includeReasons = false,
        array $serviceIds = [],
    ): array {
        if ($staffMemberId && ! $this->staffIsBookable($staffMemberId, $serviceIds)) {
            return [];
        }

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
            $reason = $this->conflictReason($cursor, $slotEnd, $busy);
            $available = $reason === null;

            $slot = [
                'time' => $cursor->format('H:i'),
                'label' => $cursor->format('g:i A'),
                'available' => $available,
            ];
            if ($includeReasons && ! $available && $reason) {
                $slot['reason'] = $reason;
            }

            $slots[] = $slot;
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
        array $serviceIds = [],
    ): bool {
        if ($staffMemberId && ! $this->staffIsBookable($staffMemberId, $serviceIds)) {
            return false;
        }

        $endsAt = $startsAt->copy()->addMinutes($totalDurationMinutes);
        $busy = $this->busyRanges(
            $startsAt->copy()->startOfDay(),
            $staffMemberId,
            $locationId,
            $excludeAppointmentId,
        );

        return $this->conflictReason($startsAt, $endsAt, $busy) === null;
    }

    /**
     * @param  list<int>  $serviceIds
     */
    protected function staffIsBookable(int $staffMemberId, array $serviceIds): bool
    {
        $staff = StaffMember::query()->find($staffMemberId);
        if (! $staff || ! $staff->is_active || ! $staff->is_bookable) {
            return false;
        }

        if ($serviceIds !== [] && ! $this->staffAssignments->staffCanPerformServices($staffMemberId, $serviceIds)) {
            return false;
        }

        return true;
    }

    protected function bufferMinutes(): int
    {
        $tenant = TenantContext::get();

        return (int) ($tenant?->setting('booking_buffer_minutes', config('booking.buffer_minutes', 0)) ?? 0);
    }

    /**
     * @return Collection<int, array{start: Carbon, end: Carbon, reason: string}>
     */
    protected function busyRanges(
        Carbon $day,
        ?int $staffMemberId,
        ?int $locationId,
        ?int $excludeAppointmentId = null,
    ): Collection {
        $ranges = collect();
        $buffer = $this->bufferMinutes();

        if ($staffMemberId) {
            $ranges = $ranges->merge(
                $this->staffBreaks->breaksForStaffOnDay($staffMemberId, $day, $locationId)
            );
            $ranges = $ranges->merge(
                $this->staffTimeOff->approvedBlocksForStaffOnDay($staffMemberId, $day, $locationId)
            );
        }

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

        $appointmentRanges = $query->get(['starts_at', 'ends_at'])->map(function (Appointment $a) use ($buffer) {
            $end = $a->ends_at->copy();
            if ($buffer > 0) {
                $end->addMinutes($buffer);
            }

            return [
                'start' => $a->starts_at,
                'end' => $end,
                'reason' => $buffer > 0 && $end->gt($a->ends_at) ? 'buffer' : 'booked',
            ];
        });

        return $ranges->merge($appointmentRanges);
    }

    /**
     * @param  Collection<int, array{start: Carbon, end: Carbon, reason: string}>  $busy
     */
    protected function conflictReason(Carbon $start, Carbon $end, Collection $busy): ?string
    {
        foreach ($busy as $range) {
            if ($start->lt($range['end']) && $end->gt($range['start'])) {
                return $range['reason'];
            }
        }

        return null;
    }

    protected function parseTimeOnDay(Carbon $day, string $time): Carbon
    {
        [$h, $m] = array_pad(explode(':', $time), 2, 0);

        return $day->copy()->setTime((int) $h, (int) $m, 0);
    }

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
