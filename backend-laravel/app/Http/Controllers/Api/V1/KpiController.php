<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\KpiMetric;
use App\Http\Controllers\Api\V1\Concerns\ResolvesTenantFromRequest;
use App\Http\Controllers\Controller;
use App\Models\KpiTarget;
use App\Services\KpiService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class KpiController extends Controller
{
    use ResolvesTenantFromRequest;

    public function __construct(
        private readonly KpiService $kpis,
    ) {}

    public function index(Request $request, string $tenantSlug): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);
        $filters = $request->validate([
            'metric' => ['nullable', 'string', Rule::in(array_column(KpiMetric::cases(), 'value'))],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        $paginator = $this->kpis->paginateTargets($tenant->id, $filters, (int) ($filters['per_page'] ?? 20));

        return response()->json([
            'data' => collect($paginator->items())->map(fn (KpiTarget $target) => $this->kpis->format($target)),
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
            'metric' => ['required', 'string', Rule::in(array_column(KpiMetric::cases(), 'value'))],
            'period' => ['required', 'string', 'max:32'],
            'target_value' => ['required', 'integer', 'min:0'],
            'location_id' => ['nullable', 'integer', 'exists:locations,id'],
            'staff_member_id' => ['nullable', 'integer', 'exists:staff_members,id'],
            'period_start' => ['nullable', 'date'],
            'period_end' => ['nullable', 'date'],
        ]);

        $target = $this->kpis->create($tenant->id, $data);

        return response()->json(['data' => $this->kpis->format($target)], 201);
    }

    public function show(Request $request, string $tenantSlug, KpiTarget $kpiTarget): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);
        abort_unless($kpiTarget->tenant_id === $tenant->id, 404);

        return response()->json(['data' => $this->kpis->format($kpiTarget)]);
    }

    public function update(Request $request, string $tenantSlug, KpiTarget $kpiTarget): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);
        abort_unless($kpiTarget->tenant_id === $tenant->id, 404);

        $data = $request->validate([
            'metric' => ['sometimes', 'string', Rule::in(array_column(KpiMetric::cases(), 'value'))],
            'period' => ['sometimes', 'string', 'max:32'],
            'target_value' => ['sometimes', 'integer', 'min:0'],
            'location_id' => ['nullable', 'integer', 'exists:locations,id'],
            'staff_member_id' => ['nullable', 'integer', 'exists:staff_members,id'],
            'period_start' => ['nullable', 'date'],
            'period_end' => ['nullable', 'date'],
        ]);

        $target = $this->kpis->update($kpiTarget, $data);

        return response()->json(['data' => $this->kpis->format($target)]);
    }

    public function destroy(Request $request, string $tenantSlug, KpiTarget $kpiTarget): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);
        abort_unless($kpiTarget->tenant_id === $tenant->id, 404);

        $this->kpis->delete($kpiTarget);

        return response()->json(['message' => 'KPI target deleted.']);
    }

    public function dashboard(Request $request, string $tenantSlug): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);

        return response()->json($this->kpis->dashboard($tenant->id));
    }
}
