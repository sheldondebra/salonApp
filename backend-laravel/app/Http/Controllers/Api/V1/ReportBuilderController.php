<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\V1\Concerns\ResolvesTenantFromRequest;
use App\Http\Controllers\Controller;
use App\Models\ReportDefinition;
use App\Services\ReportBuilderService;
use App\Support\ReportFilters;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReportBuilderController extends Controller
{
    use ResolvesTenantFromRequest;

    public function __construct(
        private readonly ReportBuilderService $reportBuilder,
    ) {}

    public function index(Request $request, string $tenantSlug): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);
        $filters = $request->validate([
            'q' => ['nullable', 'string', 'max:100'],
            'report_type' => ['nullable', 'string', 'max:64'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        $paginator = $this->reportBuilder->paginateDefinitions($tenant->id, $filters, (int) ($filters['per_page'] ?? 20));

        return response()->json([
            'data' => collect($paginator->items())->map(fn (ReportDefinition $definition) => $this->reportBuilder->format($definition)),
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
            'name' => ['required', 'string', 'max:255'],
            'report_type' => ['required', 'string', 'max:64'],
            'config' => ['nullable', 'array'],
        ]);

        $definition = $this->reportBuilder->create($tenant->id, $data, $request->user());

        return response()->json(['data' => $this->reportBuilder->format($definition)], 201);
    }

    public function show(Request $request, string $tenantSlug, ReportDefinition $reportDefinition): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);
        abort_unless($reportDefinition->tenant_id === $tenant->id, 404);

        return response()->json(['data' => $this->reportBuilder->format($reportDefinition)]);
    }

    public function update(Request $request, string $tenantSlug, ReportDefinition $reportDefinition): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);
        abort_unless($reportDefinition->tenant_id === $tenant->id, 404);

        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'report_type' => ['sometimes', 'string', 'max:64'],
            'config' => ['nullable', 'array'],
        ]);

        $definition = $this->reportBuilder->update($reportDefinition, $data);

        return response()->json(['data' => $this->reportBuilder->format($definition)]);
    }

    public function destroy(Request $request, string $tenantSlug, ReportDefinition $reportDefinition): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);
        abort_unless($reportDefinition->tenant_id === $tenant->id, 404);

        $this->reportBuilder->delete($reportDefinition);

        return response()->json(['message' => 'Saved report deleted.']);
    }

    public function preview(Request $request, string $tenantSlug, ReportDefinition $reportDefinition): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);
        abort_unless($reportDefinition->tenant_id === $tenant->id, 404);

        $filters = ReportFilters::fromRequest($request, $tenant->id);

        return response()->json([
            'data' => $this->reportBuilder->preview($reportDefinition, $filters),
        ]);
    }

    public function previewDraft(Request $request, string $tenantSlug): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);
        $data = $request->validate([
            'source' => ['nullable', 'string', 'max:64'],
            'report_type' => ['nullable', 'string', 'max:64'],
            'fields' => ['nullable', 'array'],
            'group_by' => ['nullable', 'string', 'max:64'],
        ]);

        $definition = new ReportDefinition([
            'tenant_id' => $tenant->id,
            'name' => 'Preview',
            'report_type' => $data['report_type'] ?? $data['source'] ?? 'analytics',
            'config' => [
                'fields' => $data['fields'] ?? [],
                'group_by' => $data['group_by'] ?? null,
            ],
        ]);

        $filters = ReportFilters::fromRequest($request, $tenant->id);
        $preview = $this->reportBuilder->preview($definition, $filters);

        return response()->json([
            'columns' => array_keys($preview['summary'] ?? $preview),
            'rows' => [is_array($preview) ? $preview : []],
        ]);
    }
}
