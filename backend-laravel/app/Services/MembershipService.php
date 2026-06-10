<?php

namespace App\Services;

use App\Enums\ClientMembershipStatus;
use App\Models\ClientMembership;
use App\Models\MembershipPlan;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class MembershipService
{
    public function paginatePlans(int $tenantId, array $filters = [], int $perPage = 20): LengthAwarePaginator
    {
        $query = MembershipPlan::query()
            ->where('tenant_id', $tenantId)
            ->orderBy('sort_order')
            ->orderBy('name');

        if (isset($filters['is_active'])) {
            $query->whereBool('is_active', (bool) $filters['is_active']);
        }

        if (! empty($filters['q'])) {
            $term = '%'.$filters['q'].'%';
            $query->where(fn ($q) => $q->where('name', 'like', $term)->orWhere('description', 'like', $term));
        }

        return $query->paginate(min($perPage, 50));
    }

    public function createPlan(int $tenantId, array $data): MembershipPlan
    {
        return MembershipPlan::query()->create($this->planPayload($tenantId, $data));
    }

    public function updatePlan(MembershipPlan $plan, array $data): MembershipPlan
    {
        $plan->update($this->planPayload($plan->tenant_id, $data, false));

        return $plan->fresh();
    }

    public function deletePlan(MembershipPlan $plan): void
    {
        $plan->update(['is_active' => false]);
    }

    public function listClientMemberships(int $tenantId, array $filters = [], int $perPage = 20): LengthAwarePaginator
    {
        $query = ClientMembership::query()
            ->where('tenant_id', $tenantId)
            ->with(['plan', 'client:id,name,email', 'soldBy:id,name', 'sale:id,uuid,sale_number,total_cents'])
            ->latest();

        if (! empty($filters['client_user_id'])) {
            $query->where('client_user_id', (int) $filters['client_user_id']);
        }

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        return $query->paginate(min($perPage, 50));
    }

    public function assignMembership(int $tenantId, array $data, ?User $actor = null): ClientMembership
    {
        $plan = MembershipPlan::query()
            ->where('tenant_id', $tenantId)
            ->findOrFail($data['membership_plan_id']);

        $startsAt = isset($data['starts_at']) ? now()->parse($data['starts_at']) : now();
        $endsAt = isset($data['ends_at'])
            ? now()->parse($data['ends_at'])
            : match ($plan->billing_interval) {
                'weekly' => $startsAt->copy()->addWeek(),
                'yearly' => $startsAt->copy()->addYear(),
                default => $startsAt->copy()->addMonth(),
            };

        return ClientMembership::query()->create([
            'tenant_id' => $tenantId,
            'membership_plan_id' => $plan->id,
            'client_user_id' => $data['client_user_id'],
            'status' => $data['status'] ?? ClientMembershipStatus::Active,
            'starts_at' => $startsAt,
            'ends_at' => $endsAt,
            'next_billing_at' => $data['next_billing_at'] ?? $endsAt,
            'sold_by_user_id' => $actor?->id,
            'sale_id' => $data['sale_id'] ?? null,
        ])->fresh(['plan', 'client', 'soldBy', 'sale']);
    }

    public function formatPlan(MembershipPlan $plan): array
    {
        return [
            'uuid' => $plan->uuid,
            'name' => $plan->name,
            'description' => $plan->description,
            'price_cents' => (int) $plan->price_cents,
            'billing_interval' => $plan->billing_interval,
            'discount_percent' => (int) $plan->discount_percent,
            'free_service_ids' => array_values($plan->free_service_ids ?? []),
            'priority_booking' => (bool) $plan->priority_booking,
            'points_multiplier' => (float) $plan->points_multiplier,
            'is_active' => (bool) $plan->is_active,
            'sort_order' => (int) $plan->sort_order,
            'created_at' => $plan->created_at?->toIso8601String(),
            'updated_at' => $plan->updated_at?->toIso8601String(),
        ];
    }

    public function formatMembership(ClientMembership $membership): array
    {
        $membership->loadMissing(['plan', 'client:id,name,email', 'soldBy:id,name', 'sale:id,uuid,sale_number,total_cents']);

        return [
            'uuid' => $membership->uuid,
            'status' => $membership->status?->value ?? $membership->status,
            'starts_at' => $membership->starts_at?->toIso8601String(),
            'ends_at' => $membership->ends_at?->toIso8601String(),
            'next_billing_at' => $membership->next_billing_at?->toIso8601String(),
            'plan' => $membership->plan ? $this->formatPlan($membership->plan) : null,
            'client' => $membership->client ? [
                'id' => $membership->client->id,
                'name' => $membership->client->name,
                'email' => $membership->client->email,
            ] : null,
            'sold_by' => $membership->soldBy ? [
                'id' => $membership->soldBy->id,
                'name' => $membership->soldBy->name,
            ] : null,
            'sale' => $membership->sale ? [
                'id' => $membership->sale->id,
                'uuid' => $membership->sale->uuid,
                'sale_number' => $membership->sale->sale_number,
                'total_cents' => (int) $membership->sale->total_cents,
            ] : null,
        ];
    }

    private function planPayload(int $tenantId, array $data, bool $creating = true): array
    {
        $payload = [];
        foreach ([
            'name',
            'description',
            'price_cents',
            'billing_interval',
            'discount_percent',
            'priority_booking',
            'points_multiplier',
            'is_active',
            'sort_order',
        ] as $key) {
            if ($creating || array_key_exists($key, $data)) {
                $payload[$key] = $data[$key] ?? null;
            }
        }

        if ($creating) {
            $payload['tenant_id'] = $tenantId;
        }

        if ($creating || array_key_exists('free_service_ids', $data)) {
            $payload['free_service_ids'] = array_values(array_map('intval', $data['free_service_ids'] ?? []));
        }

        return $payload;
    }
}
