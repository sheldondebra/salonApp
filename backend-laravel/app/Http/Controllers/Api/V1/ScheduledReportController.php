<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\V1\Concerns\ResolvesTenantFromRequest;
use App\Http\Controllers\Controller;
use App\Models\ScheduledReport;
use App\Services\ScheduledReportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ScheduledReportController extends Controller
{
    use ResolvesTenantFromRequest;

    public function __construct(
        private readonly ScheduledReportService $scheduledReports,
    ) {}

    public function index(Request $request, string $tenantSlug): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);
        $paginator = $this->scheduledReports->paginate($tenant->id, (int) $request->integer('per_page', 20));

        return response()->json([
            'data' => collect($paginator->items())->map(fn (ScheduledReport $schedule) => $this->scheduledReports->format($schedule)),
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
        $data = $request->validate([
            'report_definition_id' => ['required', 'integer', 'exists:report_definitions,id'],
            'frequency' => ['required', 'string', 'in:daily,weekly,monthly'],
            'recipients' => ['nullable', 'array'],
            'recipients.*' => ['email'],
            'is_active' => ['nullable', 'boolean'],
            'next_run_at' => ['nullable', 'date'],
        ]);

        $schedule = $this->scheduledReports->create($tenant->id, $data);

        return response()->json(['data' => $this->scheduledReports->format($schedule)], 201);
    }

    public function update(Request $request, string $tenantSlug, ScheduledReport $scheduledReport): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);
        abort_unless($scheduledReport->tenant_id === $tenant->id, 404);

        $data = $request->validate([
            'frequency' => ['sometimes', 'string', 'in:daily,weekly,monthly'],
            'recipients' => ['nullable', 'array'],
            'recipients.*' => ['email'],
            'is_active' => ['nullable', 'boolean'],
            'next_run_at' => ['nullable', 'date'],
        ]);

        $schedule = $this->scheduledReports->update($scheduledReport, $data);

        return response()->json(['data' => $this->scheduledReports->format($schedule)]);
    }

    public function destroy(Request $request, string $tenantSlug, ScheduledReport $scheduledReport): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);
        abort_unless($scheduledReport->tenant_id === $tenant->id, 404);

        $this->scheduledReports->delete($scheduledReport);

        return response()->json(['message' => 'Scheduled report deleted.']);
    }

    public function run(Request $request, string $tenantSlug, ScheduledReport $scheduledReport): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);
        abort_unless($scheduledReport->tenant_id === $tenant->id, 404);

        $run = $this->scheduledReports->runPlaceholder($scheduledReport);

        return response()->json(['data' => [
            'schedule' => $this->scheduledReports->format($scheduledReport->fresh()),
            'run' => [
                'uuid' => $run->uuid,
                'status' => $run->status,
                'result_summary' => $run->result_summary,
                'sent_at' => $run->sent_at?->toIso8601String(),
            ],
        ]]);
    }
}
