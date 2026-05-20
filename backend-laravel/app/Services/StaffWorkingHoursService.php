<?php

namespace App\Services;

use App\Models\StaffMember;
use App\Models\StaffWorkingHour;
use App\Support\TenantContext;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Validation\ValidationException;

class StaffWorkingHoursService
{
    public const DAY_LABELS = [
        1 => 'Monday',
        2 => 'Tuesday',
        3 => 'Wednesday',
        4 => 'Thursday',
        5 => 'Friday',
        6 => 'Saturday',
        7 => 'Sunday',
    ];

    /**
     * @return Collection<int, StaffWorkingHour>
     */
    public function forStaff(StaffMember $staffMember, ?int $locationId = null): Collection
    {
        $query = StaffWorkingHour::query()
            ->where('staff_member_id', $staffMember->id)
            ->orderBy('day_of_week');

        if ($locationId !== null) {
            $query->where('location_id', $locationId);
        }

        $rows = $query->get();

        if ($rows->isEmpty() && $locationId === null) {
            return $this->defaultWeek($staffMember);
        }

        return $this->normalizeWeek($staffMember, $rows);
    }

    public function staffHasCustomSchedule(int $staffMemberId): bool
    {
        return StaffWorkingHour::query()
            ->where('staff_member_id', $staffMemberId)
            ->exists();
    }

    /**
     * Open/close for a date, or null pair when closed. Returns null to use tenant default hours.
     *
     * @return array{0: ?string, 1: ?string}|null null = no staff schedule configured
     */
    public function hoursForStaffOnDay(int $staffMemberId, Carbon $day, ?int $locationId = null): ?array
    {
        if (! $this->staffHasCustomSchedule($staffMemberId)) {
            return null;
        }

        $row = $this->resolveRowForDay($staffMemberId, $day, $locationId);

        if (! $row || ! $row->is_working_day) {
            return [null, null];
        }

        $start = $row->startTimeHi();
        $end = $row->endTimeHi();

        if (! $start || ! $end) {
            return [null, null];
        }

        return [$start, $end];
    }

    /**
     * @param  list<array{day_of_week: int, is_working_day: bool, start_time?: ?string, end_time?: ?string}>  $days
     * @return Collection<int, StaffWorkingHour>
     */
    public function syncWeek(StaffMember $staffMember, array $days, ?int $locationId = null): Collection
    {
        $this->validateDays($days);

        $tenantId = TenantContext::id() ?? $staffMember->tenant_id;
        $locationId = $locationId ?? $staffMember->location_id;

        $saved = collect();
        foreach ($days as $day) {
            $dow = (int) $day['day_of_week'];
            $saved->push(
                StaffWorkingHour::query()->updateOrCreate(
                    [
                        'staff_member_id' => $staffMember->id,
                        'day_of_week' => $dow,
                        'location_id' => $locationId,
                    ],
                    [
                        'tenant_id' => $tenantId,
                        'is_working_day' => (bool) ($day['is_working_day'] ?? false),
                        'start_time' => ($day['is_working_day'] ?? false) ? ($day['start_time'] ?? '09:00') : null,
                        'end_time' => ($day['is_working_day'] ?? false) ? ($day['end_time'] ?? '18:00') : null,
                    ]
                )
            );
        }

        return $this->normalizeWeek($staffMember, $saved);
    }

    /**
     * @param  list<int>  $toDays ISO 1-7
     * @return Collection<int, StaffWorkingHour>
     */
    public function copyDay(StaffMember $staffMember, int $fromDay, array $toDays, ?int $locationId = null): Collection
    {
        $locationId = $locationId ?? $staffMember->location_id;
        $source = StaffWorkingHour::query()
            ->where('staff_member_id', $staffMember->id)
            ->where('day_of_week', $fromDay)
            ->where('location_id', $locationId)
            ->first();

        if (! $source) {
            $week = $this->forStaff($staffMember, $locationId);
            $source = $week->firstWhere('day_of_week', $fromDay);
        }

        if (! $source) {
            throw ValidationException::withMessages([
                'from_day' => ['Source day has no schedule.'],
            ]);
        }

        $days = [];
        foreach ($toDays as $dow) {
            $days[] = [
                'day_of_week' => (int) $dow,
                'is_working_day' => $source->is_working_day,
                'start_time' => $source->startTimeHi(),
                'end_time' => $source->endTimeHi(),
            ];
        }

        return $this->syncWeek($staffMember, $days, $locationId);
    }

    /**
     * @param  list<int>  $staffIds
     * @param  list<array{day_of_week: int, is_working_day: bool, start_time?: ?string, end_time?: ?string}>  $days
     */
    public function applyToStaffIds(array $staffIds, array $days, ?int $locationId = null): int
    {
        $this->validateDays($days);
        $count = 0;

        foreach ($staffIds as $staffId) {
            $staff = StaffMember::query()->find($staffId);
            if (! $staff) {
                continue;
            }
            $this->syncWeek($staff, $days, $locationId ?? $staff->location_id);
            $count++;
        }

        return $count;
    }

    /**
     * @param  list<array{day_of_week: int, is_working_day: bool, start_time?: ?string, end_time?: ?string}>  $days
     */
    protected function validateDays(array $days): void
    {
        $seen = [];
        foreach ($days as $i => $day) {
            $dow = (int) ($day['day_of_week'] ?? 0);
            if ($dow < 1 || $dow > 7) {
                throw ValidationException::withMessages([
                    "days.{$i}.day_of_week" => ['Day must be between 1 (Monday) and 7 (Sunday).'],
                ]);
            }
            if (isset($seen[$dow])) {
                throw ValidationException::withMessages([
                    "days.{$i}.day_of_week" => ['Duplicate day in schedule.'],
                ]);
            }
            $seen[$dow] = true;

            if (! ($day['is_working_day'] ?? false)) {
                continue;
            }

            $start = $day['start_time'] ?? null;
            $end = $day['end_time'] ?? null;
            if (! $start || ! $end) {
                throw ValidationException::withMessages([
                    "days.{$i}.start_time" => ['Start and end times are required for working days.'],
                ]);
            }

            if (strtotime($end) <= strtotime($start)) {
                throw ValidationException::withMessages([
                    "days.{$i}.end_time" => ['End time must be after start time.'],
                ]);
            }
        }
    }

    protected function resolveRowForDay(int $staffMemberId, Carbon $day, ?int $locationId): ?StaffWorkingHour
    {
        $dow = $day->dayOfWeekIso;
        $date = $day->toDateString();

        $base = StaffWorkingHour::query()
            ->where('staff_member_id', $staffMemberId)
            ->where('day_of_week', $dow)
            ->where(function ($q) use ($date) {
                $q->whereNull('effective_from')->orWhere('effective_from', '<=', $date);
            })
            ->where(function ($q) use ($date) {
                $q->whereNull('effective_to')->orWhere('effective_to', '>=', $date);
            });

        if ($locationId) {
            $match = (clone $base)->where('location_id', $locationId)->first();
            if ($match) {
                return $match;
            }
        }

        return $base->whereNull('location_id')->first()
            ?? $base->first();
    }

    /**
     * @return Collection<int, StaffWorkingHour>
     */
    protected function defaultWeek(StaffMember $staffMember): Collection
    {
        $tenantId = $staffMember->tenant_id;
        $locationId = $staffMember->location_id;

        return collect(range(1, 7))->map(fn (int $dow) => new StaffWorkingHour([
            'tenant_id' => $tenantId,
            'staff_member_id' => $staffMember->id,
            'location_id' => $locationId,
            'day_of_week' => $dow,
            'is_working_day' => $dow <= 5,
            'start_time' => $dow <= 5 ? '09:00' : null,
            'end_time' => $dow <= 5 ? '18:00' : null,
        ]));
    }

    /**
     * @param  Collection<int, StaffWorkingHour>  $rows
     * @return Collection<int, StaffWorkingHour>
     */
    protected function normalizeWeek(StaffMember $staffMember, Collection $rows): Collection
    {
        $byDay = $rows->keyBy('day_of_week');
        $defaults = $this->defaultWeek($staffMember);

        return collect(range(1, 7))->map(function (int $dow) use ($byDay, $defaults, $staffMember) {
            if ($byDay->has($dow)) {
                return $byDay->get($dow);
            }
            $fallback = $defaults->firstWhere('day_of_week', $dow);

            return $fallback ?? new StaffWorkingHour([
                'staff_member_id' => $staffMember->id,
                'day_of_week' => $dow,
                'is_working_day' => false,
            ]);
        });
    }
}
