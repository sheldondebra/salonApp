<?php

namespace App\Services;

use App\Enums\SaleStatus;
use App\Models\Sale;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

class FinanceTipsService
{
    /**
     * @param  array<string, mixed>  $filters
     */
    public function paginate(int $tenantId, array $filters = [], int $perPage = 20): LengthAwarePaginator
    {
        $perPage = max(1, min($perPage, 100));

        return $this->baseQuery($tenantId, $filters)
            ->with(['client:id,name,email,phone', 'location:id,name', 'createdBy:id,name'])
            ->orderByDesc('completed_at')
            ->orderByDesc('id')
            ->paginate($perPage)
            ->through(fn (Sale $sale) => $this->formatTip($sale));
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return array{total_tips_cents: int, tip_count: int, average_tip_cents: int}
     */
    public function summary(int $tenantId, array $filters = []): array
    {
        $query = $this->baseQuery($tenantId, $filters);
        $total = (int) (clone $query)->sum('tip_cents');
        $count = (int) (clone $query)->count();

        return [
            'total_tips_cents' => $total,
            'tip_count' => $count,
            'average_tip_cents' => $count > 0 ? (int) round($total / $count) : 0,
        ];
    }

    /**
     * @return list<array{month: string, tips_cents: int, tip_count: int}>
     */
    public function monthlyTrend(int $tenantId, int $months = 6): array
    {
        $start = now()->startOfMonth()->subMonths($months - 1);

        $rows = Sale::query()
            ->where('tenant_id', $tenantId)
            ->where('status', SaleStatus::Completed)
            ->where('tip_cents', '>', 0)
            ->whereDate('completed_at', '>=', $start->toDateString())
            ->get()
            ->groupBy(fn (Sale $sale) => $sale->completed_at?->format('Y-m') ?? 'unknown')
            ->map(fn ($group) => [
                'tips_cents' => (int) $group->sum('tip_cents'),
                'tip_count' => $group->count(),
            ]);

        $points = [];
        for ($i = 0; $i < $months; $i++) {
            $date = $start->copy()->addMonths($i);
            $key = $date->format('Y-m');
            $row = $rows[$key] ?? null;
            $points[] = [
                'month' => $key,
                'label' => $date->format('M Y'),
                'tips_cents' => (int) ($row['tips_cents'] ?? 0),
                'tip_count' => (int) ($row['tip_count'] ?? 0),
            ];
        }

        return $points;
    }

    /** @return array<string, mixed> */
    public function formatTip(Sale $sale): array
    {
        return [
            'id' => $sale->id,
            'source' => 'pos_sale',
            'sale_number' => $sale->sale_number,
            'tip_cents' => (int) $sale->tip_cents,
            'total_cents' => (int) $sale->total_cents,
            'currency' => $sale->currency,
            'payment_method' => $sale->payment_method,
            'completed_at' => $sale->completed_at?->toIso8601String(),
            'customer' => $sale->client ? [
                'id' => $sale->client->id,
                'name' => $sale->client->name,
                'email' => $sale->client->email,
                'phone' => $sale->client->phone,
            ] : null,
            'branch' => $sale->location ? [
                'id' => $sale->location->id,
                'name' => $sale->location->name,
            ] : null,
            'recorded_by' => $sale->createdBy ? [
                'id' => $sale->createdBy->id,
                'name' => $sale->createdBy->name,
            ] : null,
        ];
    }

    /**
     * @param  array<string, mixed>  $filters
     */
    private function baseQuery(int $tenantId, array $filters): Builder
    {
        $query = Sale::query()
            ->where('tenant_id', $tenantId)
            ->where('status', SaleStatus::Completed)
            ->where('tip_cents', '>', 0);

        if (! empty($filters['from'])) {
            $query->whereDate('completed_at', '>=', $filters['from']);
        }
        if (! empty($filters['to'])) {
            $query->whereDate('completed_at', '<=', $filters['to']);
        }
        if (! empty($filters['location_id'])) {
            $query->where('location_id', (int) $filters['location_id']);
        }
        if (! empty($filters['q'])) {
            $term = '%'.str_replace(['%', '_'], ['\\%', '\\_'], (string) $filters['q']).'%';
            $query->where(function (Builder $q) use ($term) {
                $q->where('sale_number', 'ilike', $term)
                    ->orWhereHas('client', fn (Builder $c) => $c->where('name', 'ilike', $term));
            });
        }

        return $query;
    }
}
