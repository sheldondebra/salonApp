<?php

namespace App\Services;

use App\Models\StaffBreak;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Validation\ValidationException;

class StaffBreakService
{
    /**
     * @return Collection<int, array{start: Carbon, end: Carbon, reason: string}>
     */
    public function breaksForStaffOnDay(int $staffMemberId, Carbon $day, ?int $locationId = null): Collection
    {
        $dow = $day->dayOfWeekIso;

        return StaffBreak::query()
            ->where('staff_member_id', $staffMemberId)
            ->where(function ($q) use ($day, $dow) {
                $q->where(function ($q2) use ($dow) {
                    $q2->where('repeats_weekly', true)->where('day_of_week', $dow);
                })->orWhere(function ($q2) use ($day) {
                    $q2->where('repeats_weekly', false)->whereDate('date', $day->toDateString());
                });
            })
            ->when($locationId !== null, function ($q) use ($locationId) {
                $q->where(function ($q2) use ($locationId) {
                    $q2->whereNull('location_id')->orWhere('location_id', $locationId);
                });
            })
            ->get()
            ->map(fn (StaffBreak $break) => [
                'start' => $this->parseTimeOnDay($day, $this->timeString($break->start_time)),
                'end' => $this->parseTimeOnDay($day, $this->timeString($break->end_time)),
                'reason' => 'break',
            ]);
    }

    /**
     * @return Collection<int, StaffBreak>
     */
    public function listForStaff(int $staffMemberId): Collection
    {
        return StaffBreak::query()
            ->where('staff_member_id', $staffMemberId)
            ->orderBy('day_of_week')
            ->orderBy('start_time')
            ->get();
    }

  /**
     * @param  array<string, mixed>  $data
     */
    public function create(int $staffMemberId, int $tenantId, array $data): StaffBreak
    {
        $this->validateTimes($data);

        return StaffBreak::query()->create([
            'tenant_id' => $tenantId,
            'staff_member_id' => $staffMemberId,
            ...$data,
        ]);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(StaffBreak $break, array $data): StaffBreak
    {
        $merged = array_merge($break->only([
            'title', 'break_type', 'day_of_week', 'start_time', 'end_time',
            'repeats_weekly', 'date', 'note', 'location_id',
        ]), $data);
        $this->validateTimes($merged);
        $break->update($data);

        return $break->fresh();
    }

    /**
     * @param  array<string, mixed>  $data
     */
    protected function validateTimes(array $data): void
    {
        $start = $data['start_time'] ?? null;
        $end = $data['end_time'] ?? null;
        if ($start && $end && $start >= $end) {
            throw ValidationException::withMessages([
                'end_time' => ['End time must be after start time.'],
            ]);
        }

        $repeatsWeekly = (bool) ($data['repeats_weekly'] ?? true);
        if ($repeatsWeekly && empty($data['day_of_week'])) {
            throw ValidationException::withMessages([
                'day_of_week' => ['Day of week is required for recurring breaks.'],
            ]);
        }
        if (! $repeatsWeekly && empty($data['date'])) {
            throw ValidationException::withMessages([
                'date' => ['Date is required for one-time breaks.'],
            ]);
        }
    }

    protected function parseTimeOnDay(Carbon $day, string $time): Carbon
    {
        [$h, $m] = array_pad(explode(':', $time), 2, 0);

        return $day->copy()->setTime((int) $h, (int) $m, 0);
    }

    protected function timeString(mixed $value): string
    {
        if ($value instanceof Carbon) {
            return $value->format('H:i');
        }

        return substr((string) $value, 0, 5);
    }
}
