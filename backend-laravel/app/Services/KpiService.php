<?php

namespace App\Services;

use App\Enums\KpiMetric;
use App\Enums\SaleItemType;
use App\Models\Appointment;
use App\Models\KpiTarget;
use App\Models\Sale;
use App\Models\SaleItem;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class KpiService
{
    public function paginateTargets(int $tenantId, array $filters = [], int $perPage = 20): LengthAwarePaginator
    {
        $query = KpiTarget::query()->where('tenant_id', $tenantId)->latest();

        if (! empty($filters['metric'])) {
            $query->where('metric', $filters['metric']);
        }

        return $query->paginate(min($perPage, 50));
    }

    public function create(int $tenantId, array $data): KpiTarget
    {
        return KpiTarget::query()->create([
            'tenant_id' => $tenantId,
            'metric' => $data['metric'],
            'period' => $data['period'],
            'target_value' => (int) $data['target_value'],
            'location_id' => $data['location_id'] ?? null,
            'staff_member_id' => $data['staff_member_id'] ?? null,
            'period_start' => $data['period_start'] ?? null,
            'period_end' => $data['period_end'] ?? null,
        ]);
    }

    public function update(KpiTarget $target, array $data): KpiTarget
    {
        $target->update($data);

        return $target->fresh();
    }

    public function delete(KpiTarget $target): void
    {
        $target->delete();
    }

    public function progress(KpiTarget $target): array
    {
        $actual = match ($target->metric) {
            KpiMetric::Revenue => $this->revenueActual($target),
            KpiMetric::Bookings => $this->bookingsActual($target),
            KpiMetric::Retail => $this->retailActual($target),
            KpiMetric::Staff => $this->staffActual($target),
        };

        return [
            'target_uuid' => $target->uuid,
            'metric' => $target->metric->value,
            'target_value' => (int) $target->target_value,
            'actual_value' => $actual,
            'progress_percent' => $target->target_value > 0 ? round(($actual / $target->target_value) * 100, 2) : 0,
            'period' => [
                'start' => $target->period_start?->toDateString(),
                'end' => $target->period_end?->toDateString(),
            ],
        ];
    }

    public function format(KpiTarget $target): array
    {
        return array_merge([
            'uuid' => $target->uuid,
            'metric' => $target->metric->value,
            'period' => $target->period,
            'target_value' => (int) $target->target_value,
            'location_id' => $target->location_id,
            'staff_member_id' => $target->staff_member_id,
            'period_start' => $target->period_start?->toDateString(),
            'period_end' => $target->period_end?->toDateString(),
        ], $this->progress($target));
    }

    public function dashboard(int $tenantId): array
    {
        $targets = KpiTarget::query()->where('tenant_id', $tenantId)->latest()->limit(20)->get();
        $rows = $targets->map(function (KpiTarget $target) {
            $progress = $this->progress($target);
            $metric = $target->metric->value;

            return [
                'id' => $target->id,
                'metric' => $metric,
                'label' => ucfirst(str_replace('_', ' ', $metric)),
                'unit' => in_array($metric, ['revenue', 'retail'], true) ? 'currency' : 'count',
                'target_value' => (int) $progress['target_value'],
                'actual_value' => (int) $progress['actual_value'],
                'progress_percent' => (float) $progress['progress_percent'],
                'period_label' => $target->period,
            ];
        });

        $onTrack = $rows->where('progress_percent', '>=', 80)->count();
        $atRisk = $rows->where('progress_percent', '<', 80)->count();

        return [
            'summary' => [
                'targets' => $rows->count(),
                'on_track' => $onTrack,
                'at_risk' => $atRisk,
                'average_progress_percent' => round((float) $rows->avg('progress_percent'), 1),
            ],
            'targets' => $rows->values()->all(),
        ];
    }

    private function revenueActual(KpiTarget $target): int
    {
        return (int) $this->salesQuery($target)->sum('total_cents');
    }

    private function bookingsActual(KpiTarget $target): int
    {
        return $this->appointmentsQuery($target)->count();
    }

    private function retailActual(KpiTarget $target): int
    {
        return (int) SaleItem::query()
            ->where('tenant_id', $target->tenant_id)
            ->where('item_type', SaleItemType::Product)
            ->whereHas('sale', fn ($q) => $this->applySaleFilters($q, $target))
            ->sum('line_total_cents');
    }

    private function staffActual(KpiTarget $target): int
    {
        return $this->appointmentsQuery($target)->count();
    }

    private function salesQuery(KpiTarget $target)
    {
        $query = Sale::query()->where('tenant_id', $target->tenant_id);

        return $this->applySaleFilters($query, $target);
    }

    private function appointmentsQuery(KpiTarget $target)
    {
        $query = Appointment::query()->where('tenant_id', $target->tenant_id);

        if ($target->location_id) {
            $query->where('location_id', $target->location_id);
        }

        if ($target->staff_member_id) {
            $query->where('staff_member_id', $target->staff_member_id);
        }

        if ($target->period_start) {
            $query->whereDate('starts_at', '>=', $target->period_start);
        }

        if ($target->period_end) {
            $query->whereDate('starts_at', '<=', $target->period_end);
        }

        return $query;
    }

    private function applySaleFilters($query, KpiTarget $target)
    {
        if ($target->location_id) {
            $query->where('location_id', $target->location_id);
        }

        if ($target->period_start) {
            $query->whereDate('completed_at', '>=', $target->period_start);
        }

        if ($target->period_end) {
            $query->whereDate('completed_at', '<=', $target->period_end);
        }

        return $query;
    }
}
