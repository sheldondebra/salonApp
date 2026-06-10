<?php

namespace App\Services;

use App\Models\ReportDefinition;
use App\Models\User;
use App\Support\ReportFilters;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class ReportBuilderService
{
    public function __construct(
        private readonly ReportsService $reports,
        private readonly AnalyticsInsightsService $insights,
    ) {}

    public function paginateDefinitions(int $tenantId, array $filters = [], int $perPage = 20): LengthAwarePaginator
    {
        $query = ReportDefinition::query()->where('tenant_id', $tenantId)->latest();

        if (! empty($filters['report_type'])) {
            $query->where('report_type', $filters['report_type']);
        }

        if (! empty($filters['q'])) {
            $term = '%'.$filters['q'].'%';
            $query->where('name', 'like', $term);
        }

        return $query->paginate(min($perPage, 50));
    }

    public function create(int $tenantId, array $data, ?User $actor = null): ReportDefinition
    {
        return ReportDefinition::query()->create([
            'tenant_id' => $tenantId,
            'name' => $data['name'],
            'report_type' => $data['report_type'],
            'config' => $data['config'] ?? [],
            'created_by_user_id' => $actor?->id,
        ]);
    }

    public function update(ReportDefinition $definition, array $data): ReportDefinition
    {
        $definition->update($data);

        return $definition->fresh();
    }

    public function delete(ReportDefinition $definition): void
    {
        $definition->delete();
    }

    public function preview(ReportDefinition $definition, ReportFilters $filters): array
    {
        return match ($definition->report_type) {
            'analytics_insights' => $this->insights->dashboard($definition->tenant_id, $filters),
            'occupancy' => ['occupancy' => $this->insights->occupancyUtilization($definition->tenant_id, $filters)],
            'retention' => ['retention' => $this->insights->retentionChurn($definition->tenant_id, $filters)],
            default => $this->reports->tenantReport($filters),
        };
    }

    public function format(ReportDefinition $definition): array
    {
        return [
            'uuid' => $definition->uuid,
            'name' => $definition->name,
            'report_type' => $definition->report_type,
            'config' => $definition->config ?? [],
            'created_at' => $definition->created_at?->toIso8601String(),
            'updated_at' => $definition->updated_at?->toIso8601String(),
        ];
    }
}
