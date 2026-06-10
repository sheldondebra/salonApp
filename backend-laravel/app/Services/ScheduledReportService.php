<?php

namespace App\Services;

use App\Models\ReportRun;
use App\Models\ScheduledReport;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class ScheduledReportService
{
    public function paginate(int $tenantId, int $perPage = 20): LengthAwarePaginator
    {
        return ScheduledReport::query()
            ->where('tenant_id', $tenantId)
            ->with('definition:id,uuid,name,report_type')
            ->latest()
            ->paginate(min($perPage, 50));
    }

    public function create(int $tenantId, array $data): ScheduledReport
    {
        return ScheduledReport::query()->create([
            'tenant_id' => $tenantId,
            'report_definition_id' => $data['report_definition_id'],
            'frequency' => $data['frequency'],
            'recipients' => $data['recipients'] ?? [],
            'is_active' => $data['is_active'] ?? true,
            'next_run_at' => $data['next_run_at'] ?? now()->addDay(),
        ])->fresh('definition');
    }

    public function update(ScheduledReport $schedule, array $data): ScheduledReport
    {
        $schedule->update($data);

        return $schedule->fresh('definition');
    }

    public function delete(ScheduledReport $schedule): void
    {
        $schedule->delete();
    }

    public function runPlaceholder(ScheduledReport $schedule): ReportRun
    {
        $run = ReportRun::query()->create([
            'tenant_id' => $schedule->tenant_id,
            'scheduled_report_id' => $schedule->id,
            'report_definition_id' => $schedule->report_definition_id,
            'status' => 'completed',
            'result_summary' => [
                'message' => 'Scheduled report placeholder executed.',
                'frequency' => $schedule->frequency,
            ],
            'sent_at' => now(),
        ]);

        $schedule->update([
            'last_run_at' => now(),
            'next_run_at' => $this->nextRunAt($schedule->frequency),
        ]);

        return $run->fresh();
    }

    public function format(ScheduledReport $schedule): array
    {
        $schedule->loadMissing('definition:id,uuid,name,report_type');

        return [
            'uuid' => $schedule->uuid,
            'frequency' => $schedule->frequency,
            'recipients' => $schedule->recipients ?? [],
            'is_active' => (bool) $schedule->is_active,
            'next_run_at' => $schedule->next_run_at?->toIso8601String(),
            'last_run_at' => $schedule->last_run_at?->toIso8601String(),
            'definition' => $schedule->definition ? [
                'uuid' => $schedule->definition->uuid,
                'name' => $schedule->definition->name,
                'report_type' => $schedule->definition->report_type,
            ] : null,
        ];
    }

    private function nextRunAt(string $frequency): \Carbon\CarbonInterface
    {
        return match ($frequency) {
            'daily' => now()->addDay(),
            'monthly' => now()->addMonth(),
            default => now()->addWeek(),
        };
    }
}
