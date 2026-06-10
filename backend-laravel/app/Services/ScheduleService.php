<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\StaffBreak;
use App\Models\StaffMember;
use App\Models\StaffTimeOffRequest;
use App\Support\TenantContext;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class ScheduleService
{
    public function __construct(
        protected StaffBreakService $breaks,
    ) {}

    /**
     * @param  list<int>|null  $staffIds
     * @return Collection<int, array<string, mixed>>
     */
    public function eventsForRange(
        Carbon $from,
        Carbon $to,
        ?array $staffIds = null,
        ?int $locationId = null,
    ): Collection {
        $staffQuery = StaffMember::query()
            ->whereBool('is_active', true)
            ->orderBy('display_name');

        if ($staffIds !== null && $staffIds !== []) {
            $staffQuery->whereIn('id', $staffIds);
        }

        if ($locationId) {
            $staffQuery->where(function ($q) use ($locationId) {
                $q->whereNull('location_id')->orWhere('location_id', $locationId);
            });
        }

        $staffMembers = $staffQuery->get(['id', 'display_name', 'color_code', 'location_id']);
        $events = collect();

        foreach ($staffMembers as $staff) {
            $events = $events->merge($this->appointmentEvents($staff, $from, $to, $locationId));
            $events = $events->merge($this->breakEvents($staff, $from, $to, $locationId));
            $events = $events->merge($this->timeOffEvents($staff, $from, $to, $locationId));
        }

        return $events->sortBy('starts_at')->values();
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    protected function appointmentEvents(
        StaffMember $staff,
        Carbon $from,
        Carbon $to,
        ?int $locationId,
    ): Collection {
        $query = Appointment::query()
            ->with(['service:id,name', 'client:id,name,email'])
            ->where('staff_member_id', $staff->id)
            ->whereNotIn('status', ['cancelled', 'no_show'])
            ->where('starts_at', '<', $to)
            ->where('ends_at', '>', $from);

        if ($locationId) {
            $query->where('location_id', $locationId);
        }

        return $query->get()->map(function (Appointment $apt) use ($staff) {
            $clientName = $apt->client?->name ?? 'Walk-in';

            return [
                'id' => 'apt_'.$apt->id,
                'type' => 'appointment',
                'starts_at' => $apt->starts_at->toIso8601String(),
                'ends_at' => $apt->ends_at->toIso8601String(),
                'staff_member_id' => $staff->id,
                'location_id' => $apt->location_id,
                'title' => ($apt->service?->name ?? 'Service').' — '.$clientName,
                'status' => $apt->status,
                'color' => $staff->color_code,
                'meta' => [
                    'appointment_uuid' => $apt->uuid,
                    'client_name' => $clientName,
                    'service_name' => $apt->service?->name,
                    'payment_status' => $apt->payment_status,
                ],
            ];
        });
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    protected function breakEvents(
        StaffMember $staff,
        Carbon $from,
        Carbon $to,
        ?int $locationId,
    ): Collection {
        $events = collect();
        $cursor = $from->copy()->startOfDay();

        while ($cursor->lte($to)) {
            $dayBreaks = StaffBreak::query()
                ->where('staff_member_id', $staff->id)
                ->where(function ($q) use ($cursor) {
                    $dow = $cursor->dayOfWeekIso;
                    $q->where(function ($q2) use ($dow) {
                        $q2->where('repeats_weekly', true)->where('day_of_week', $dow);
                    })->orWhere(function ($q2) use ($cursor) {
                        $q2->where('repeats_weekly', false)->whereDate('date', $cursor->toDateString());
                    });
                })
                ->when($locationId !== null, function ($q) use ($locationId) {
                    $q->where(function ($q2) use ($locationId) {
                        $q2->whereNull('location_id')->orWhere('location_id', $locationId);
                    });
                })
                ->get();

            foreach ($dayBreaks as $break) {
                $start = $this->parseTimeOnDay($cursor, $this->timeString($break->start_time));
                $end = $this->parseTimeOnDay($cursor, $this->timeString($break->end_time));
                if ($start->lt($to) && $end->gt($from)) {
                    $events->push([
                        'id' => 'break_'.$break->id.'_'.$cursor->format('Y-m-d'),
                        'type' => 'break',
                        'starts_at' => $start->toIso8601String(),
                        'ends_at' => $end->toIso8601String(),
                        'staff_member_id' => $staff->id,
                        'location_id' => $break->location_id ?? $staff->location_id,
                        'title' => $break->title,
                        'meta' => ['break_type' => $break->break_type],
                    ]);
                }
            }

            $cursor->addDay();
        }

        return $events;
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    protected function timeOffEvents(
        StaffMember $staff,
        Carbon $from,
        Carbon $to,
        ?int $locationId,
    ): Collection {
        $query = StaffTimeOffRequest::query()
            ->where('staff_member_id', $staff->id)
            ->where('status', StaffTimeOffRequest::STATUS_APPROVED)
            ->where('start_at', '<', $to)
            ->where('end_at', '>', $from);

        if ($locationId) {
            $query->where(function ($q) use ($locationId) {
                $q->whereNull('location_id')->orWhere('location_id', $locationId);
            });
        }

        return $query->get()->map(function (StaffTimeOffRequest $row) use ($staff) {
            $label = $row->custom_purpose ?: ucfirst(str_replace('_', ' ', $row->purpose));

            return [
                'id' => 'timeoff_'.$row->id,
                'type' => 'time_off',
                'starts_at' => $row->start_at->toIso8601String(),
                'ends_at' => $row->ends_at->toIso8601String(),
                'staff_member_id' => $staff->id,
                'location_id' => $row->location_id ?? $staff->location_id,
                'title' => $label,
                'meta' => ['status' => $row->status, 'purpose' => $row->purpose],
            ];
        });
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

    /** @return array{0: string, 1: string} */
    public function defaultDayBounds(): array
    {
        $tenant = TenantContext::get();
        $buffer = (int) ($tenant?->setting('booking_buffer_minutes', config('booking.buffer_minutes', 0)) ?? 0);

        return [
            config('booking.hours.start', '09:00'),
            config('booking.hours.end', '18:00'),
        ];
    }
}
