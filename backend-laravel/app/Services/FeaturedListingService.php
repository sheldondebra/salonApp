<?php

namespace App\Services;

use App\Models\FeaturedListing;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class FeaturedListingService
{
    public function paginate(int $tenantId, int $perPage = 20): LengthAwarePaginator
    {
        return FeaturedListing::query()
            ->where('tenant_id', $tenantId)
            ->latest()
            ->paginate(min($perPage, 50));
    }

    public function create(int $tenantId, array $data): FeaturedListing
    {
        return FeaturedListing::query()->create(array_merge($data, [
            'tenant_id' => $tenantId,
        ]));
    }

    public function update(FeaturedListing $listing, array $data): FeaturedListing
    {
        $listing->update($data);

        return $listing->fresh();
    }

    public function delete(FeaturedListing $listing): void
    {
        $listing->delete();
    }

    /** @return array<string, mixed> */
    public function formatListing(FeaturedListing $listing): array
    {
        return [
            'uuid' => $listing->uuid,
            'placement' => $listing->placement,
            'starts_at' => $listing->starts_at?->toIso8601String(),
            'ends_at' => $listing->ends_at?->toIso8601String(),
            'is_sponsored' => (bool) $listing->is_sponsored,
            'billing_cents' => (int) $listing->billing_cents,
            'status' => $listing->status?->value ?? $listing->status,
        ];
    }
}
