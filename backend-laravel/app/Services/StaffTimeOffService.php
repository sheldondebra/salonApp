<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\StaffTimeOffRequest;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Validation\ValidationException;

class StaffTimeOffService
{
    /**
     * @return Collection<int, array{start: Carbon, end: Carbon, reason: string}>
     */
    public function approvedBlocksForStaffOnDay(
        int $staffMemberId,
        Carbon $day,
        ?int $locationId = null,
    ): Collection {
        $from = $day->copy()->startOfDay();
        $to = $day->copy()->endOfDay();

        return $this->approvedBlocksForRange($staffMemberId, $from, $to, $locationId);
    }

    /**
     * @return Collection<int, array{start: Carbon, end: Carbon, reason: string}>
     */
    public function approvedBlocksForRange(
        int $staffMemberId,
        Carbon $from,
        Carbon $to,
        ?int $locationId = null,
    ): Collection {
        return StaffTimeOffRequest::query()
            ->where('staff_member_id', $staffMemberId)
            ->where('status', StaffTimeOffRequest::STATUS_APPROVED)
            ->where('start_at', '<', $to)
            ->where('end_at', '>', $from)
            ->when($locationId !== null, function ($q) use ($locationId) {
                $q->where(function ($q2) use ($locationId) {
                    $q2->whereNull('location_id')->orWhere('location_id', $locationId);
                });
            })
            ->get()
            ->map(fn (StaffTimeOffRequest $row) => [
                'start' => $row->start_at,
                'end' => $row->end_at,
                'reason' => 'time_off',
            ]);
    }

    /**
     * @return Collection<int, StaffTimeOffRequest>
     */
    public function listForStaff(int $staffMemberId): Collection
    {
        return StaffTimeOffRequest::query()
            ->where('staff_member_id', $staffMemberId)
            ->whereIn('status', [
                StaffTimeOffRequest::STATUS_APPROVED,
                StaffTimeOffRequest::STATUS_PENDING,
            ])
            ->orderByDesc('start_at')
            ->get();
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function createApprovedBlock(
        int $staffMemberId,
        int $tenantId,
        array $data,
        ?int $reviewedByUserId = null,
    ): StaffTimeOffRequest {
        $start = Carbon::parse($data['start_at']);
        $end = Carbon::parse($data['end_at']);
        if ($end->lte($start)) {
            throw ValidationException::withMessages([
                'end_at' => ['End must be after start.'],
            ]);
        }

        $conflicts = $this->countConflictingAppointments($staffMemberId, $start, $end);
        if ($conflicts > 0) {
            throw ValidationException::withMessages([
                'start_at' => ["This time off overlaps {$conflicts} existing appointment(s). Reschedule or cancel them first."],
            ]);
        }

        return StaffTimeOffRequest::query()->create([
            'tenant_id' => $tenantId,
            'staff_member_id' => $staffMemberId,
            'location_id' => $data['location_id'] ?? null,
            'purpose' => $data['purpose'] ?? 'other',
            'custom_purpose' => $data['custom_purpose'] ?? null,
            'start_at' => $start,
            'end_at' => $end,
            'all_day' => (bool) ($data['all_day'] ?? false),
            'note' => $data['note'] ?? null,
            'status' => StaffTimeOffRequest::STATUS_APPROVED,
            'requested_by_user_id' => $reviewedByUserId,
            'reviewed_by_user_id' => $reviewedByUserId,
            'reviewed_at' => now(),
        ]);
    }

    public function cancel(StaffTimeOffRequest $request): StaffTimeOffRequest
    {
        $request->update(['status' => StaffTimeOffRequest::STATUS_CANCELLED]);

        return $request->fresh();
    }

    protected function countConflictingAppointments(int $staffMemberId, Carbon $start, Carbon $end): int
    {
        return Appointment::query()
            ->where('staff_member_id', $staffMemberId)
            ->whereNotIn('status', ['cancelled', 'no_show'])
            ->where('starts_at', '<', $end)
            ->where('ends_at', '>', $start)
            ->count();
    }
}
