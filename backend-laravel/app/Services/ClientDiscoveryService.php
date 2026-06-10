<?php

namespace App\Services;

use App\Models\ClientBusinessFavorite;
use App\Models\ClientRecentlyViewed;
use App\Models\Tenant;
use App\Models\User;

class ClientDiscoveryService
{
    public function __construct(
        private readonly MarketplaceProfileService $profiles,
    ) {}

    /** @return list<array<string, mixed>> */
    public function favorites(User $user): array
    {
        return ClientBusinessFavorite::query()
            ->where('user_id', $user->id)
            ->with(['tenant.marketplaceProfile', 'tenant.services', 'tenant.locations'])
            ->latest()
            ->get()
            ->map(fn (ClientBusinessFavorite $favorite) => $favorite->tenant?->marketplaceProfile
                ? $this->profiles->formatPublicProfile($favorite->tenant->marketplaceProfile)
                : null)
            ->filter()
            ->values()
            ->all();
    }

    public function addFavorite(User $user, Tenant $tenant): void
    {
        ClientBusinessFavorite::query()->firstOrCreate([
            'user_id' => $user->id,
            'tenant_id' => $tenant->id,
        ]);
    }

    public function removeFavorite(User $user, Tenant $tenant): void
    {
        ClientBusinessFavorite::query()
            ->where('user_id', $user->id)
            ->where('tenant_id', $tenant->id)
            ->delete();
    }

    public function markViewed(User $user, Tenant $tenant): ClientRecentlyViewed
    {
        ClientRecentlyViewed::query()
            ->where('user_id', $user->id)
            ->where('tenant_id', $tenant->id)
            ->delete();

        return ClientRecentlyViewed::query()->create([
            'user_id' => $user->id,
            'tenant_id' => $tenant->id,
            'viewed_at' => now(),
        ]);
    }

    /** @return list<array<string, mixed>> */
    public function recentlyViewed(User $user): array
    {
        return ClientRecentlyViewed::query()
            ->where('user_id', $user->id)
            ->with(['tenant.marketplaceProfile', 'tenant.services', 'tenant.locations'])
            ->latest('viewed_at')
            ->limit(20)
            ->get()
            ->map(function (ClientRecentlyViewed $viewed) {
                if (! $viewed->tenant?->marketplaceProfile) {
                    return null;
                }

                return array_merge(
                    $this->profiles->formatPublicProfile($viewed->tenant->marketplaceProfile),
                    ['viewed_at' => $viewed->viewed_at?->toIso8601String()]
                );
            })
            ->filter()
            ->values()
            ->all();
    }
}
