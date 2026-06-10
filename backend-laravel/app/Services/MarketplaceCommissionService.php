<?php

namespace App\Services;

use App\Models\BookingAttribution;
use App\Models\MarketplaceCommissionRule;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class MarketplaceCommissionService
{
    public function paginate(int $tenantId, int $perPage = 20): LengthAwarePaginator
    {
        return MarketplaceCommissionRule::query()
            ->where('tenant_id', $tenantId)
            ->latest()
            ->paginate(min($perPage, 50));
    }

    public function create(int $tenantId, array $data): MarketplaceCommissionRule
    {
        return MarketplaceCommissionRule::query()->create(array_merge($data, [
            'tenant_id' => $tenantId,
        ]));
    }

    public function update(MarketplaceCommissionRule $rule, array $data): MarketplaceCommissionRule
    {
        $rule->update($data);

        return $rule->fresh();
    }

    public function delete(MarketplaceCommissionRule $rule): void
    {
        $rule->delete();
    }

    /** @return array<string, mixed> */
    public function analytics(int $tenantId): array
    {
        $rules = MarketplaceCommissionRule::query()->where('tenant_id', $tenantId)->whereBool('is_active', true)->get();
        $attributions = BookingAttribution::query()->where('tenant_id', $tenantId)->count();

        $estimated = $rules->sum(function (MarketplaceCommissionRule $rule) use ($attributions) {
            return ((int) $rule->flat_fee_cents * $attributions) + (int) round(((int) $rule->percent / 100) * 10000 * $attributions);
        });

        return [
            'active_rules' => $rules->count(),
            'tracked_attributions' => $attributions,
            'estimated_commission_cents' => (int) $estimated,
        ];
    }

    /** @return array<string, mixed> */
    public function formatRule(MarketplaceCommissionRule $rule): array
    {
        return [
            'uuid' => $rule->uuid,
            'name' => $rule->name,
            'percent' => (int) $rule->percent,
            'flat_fee_cents' => (int) $rule->flat_fee_cents,
            'applies_to' => $rule->applies_to,
            'is_active' => (bool) $rule->is_active,
            'updated_at' => $rule->updated_at?->toIso8601String(),
        ];
    }
}
