<?php

namespace App\Services;

use App\Models\FeaturedListing;
use App\Models\MarketplaceProfile;
use App\Models\Service;
use App\Models\Tenant;
use Illuminate\Pagination\LengthAwarePaginator as Paginator;
use Illuminate\Support\Collection;

class MarketplaceProfileService
{
    public function forTenant(int $tenantId): MarketplaceProfile
    {
        return MarketplaceProfile::query()->firstOrCreate(
            ['tenant_id' => $tenantId],
            [
                'categories' => [],
                'photos' => [],
                'is_published' => false,
                'average_rating' => 0,
                'review_count' => 0,
            ]
        );
    }

    public function update(int $tenantId, array $data): MarketplaceProfile
    {
        $profile = $this->forTenant($tenantId);
        $published = (bool) ($data['is_published'] ?? $profile->is_published);

        $profile->update([
            'headline' => array_key_exists('headline', $data) ? $data['headline'] : $profile->headline,
            'bio' => array_key_exists('bio', $data) ? $data['bio'] : $profile->bio,
            'categories' => $data['categories'] ?? $profile->categories,
            'photos' => $data['photos'] ?? $profile->photos,
            'is_published' => $published,
            'average_rating' => $data['average_rating'] ?? $profile->average_rating,
            'review_count' => $data['review_count'] ?? $profile->review_count,
            'published_at' => $published ? ($profile->published_at ?? now()) : null,
        ]);

        return $profile->fresh();
    }

    /** @return array{data: list<array<string, mixed>>, meta: array<string, int>} */
    public function search(array $filters = []): array
    {
        $profiles = $this->publishedProfiles();
        $results = $profiles->filter(function (MarketplaceProfile $profile) use ($filters) {
            $tenant = $profile->tenantModel;
            if (! $tenant) {
                return false;
            }

            if (! empty($filters['q'])) {
                $term = mb_strtolower((string) $filters['q']);
                $haystack = mb_strtolower(implode(' ', array_filter([
                    $tenant->name,
                    $profile->headline,
                    $profile->bio,
                    $tenant->city,
                ])));

                if (! str_contains($haystack, $term)) {
                    return false;
                }
            }

            if (! empty($filters['category'])) {
                $categories = collect($profile->categories ?? [])->map(fn ($category) => mb_strtolower((string) $category));
                if (! $categories->contains(mb_strtolower((string) $filters['category']))) {
                    return false;
                }
            }

            if (! empty($filters['min_rating']) && (float) $profile->average_rating < (float) $filters['min_rating']) {
                return false;
            }

            if (! empty($filters['lat']) && ! empty($filters['lng'])) {
                $distance = $this->distanceKm(
                    (float) $filters['lat'],
                    (float) $filters['lng'],
                    (float) ($tenant->latitude ?? 0),
                    (float) ($tenant->longitude ?? 0),
                );

                if (! empty($filters['radius_km']) && $distance > (float) $filters['radius_km']) {
                    return false;
                }
            }

            return true;
        })->map(function (MarketplaceProfile $profile) use ($filters) {
            $tenant = $profile->tenantModel;
            $distanceKm = null;
            if ($tenant && ! empty($filters['lat']) && ! empty($filters['lng']) && $tenant->latitude && $tenant->longitude) {
                $distanceKm = $this->distanceKm(
                    (float) $filters['lat'],
                    (float) $filters['lng'],
                    (float) $tenant->latitude,
                    (float) $tenant->longitude,
                );
            }

            return $this->formatPublicProfile($profile, $distanceKm);
        })->sort(function (array $left, array $right) {
            $leftDistance = $left['distance_km'] ?? PHP_INT_MAX;
            $rightDistance = $right['distance_km'] ?? PHP_INT_MAX;

            if ($leftDistance === $rightDistance) {
                return ($right['average_rating'] ?? 0) <=> ($left['average_rating'] ?? 0);
            }

            return $leftDistance <=> $rightDistance;
        })->values();

        return $this->paginateCollection($results, (int) ($filters['per_page'] ?? 12), (int) ($filters['page'] ?? 1));
    }

    /** @return array{data: list<array<string, mixed>>, meta: array<string, int>} */
    public function serviceSearch(array $filters = []): array
    {
        $profiles = $this->publishedProfiles();
        $results = $profiles->filter(function (MarketplaceProfile $profile) use ($filters) {
            $tenant = $profile->tenantModel;
            if (! $tenant) {
                return false;
            }

            $services = $tenant->services;
            if (! empty($filters['q'])) {
                $term = mb_strtolower((string) $filters['q']);
                $services = $services->filter(fn (Service $service) => str_contains(mb_strtolower($service->name), $term));
            }

            if (! empty($filters['category'])) {
                $category = mb_strtolower((string) $filters['category']);
                $services = $services->filter(function (Service $service) use ($category) {
                    return mb_strtolower((string) $service->category?->name) === $category;
                });
            }

            if (! empty($filters['max_price_cents'])) {
                $services = $services->filter(fn (Service $service) => (int) $service->price_cents <= (int) $filters['max_price_cents']);
            }

            return $services->isNotEmpty();
        })->map(function (MarketplaceProfile $profile) use ($filters) {
            $tenant = $profile->tenantModel;
            $services = $tenant?->services ?? collect();

            if (! empty($filters['q'])) {
                $term = mb_strtolower((string) $filters['q']);
                $services = $services->filter(fn (Service $service) => str_contains(mb_strtolower($service->name), $term));
            }

            if (! empty($filters['category'])) {
                $category = mb_strtolower((string) $filters['category']);
                $services = $services->filter(fn (Service $service) => mb_strtolower((string) $service->category?->name) === $category);
            }

            if (! empty($filters['max_price_cents'])) {
                $services = $services->filter(fn (Service $service) => (int) $service->price_cents <= (int) $filters['max_price_cents']);
            }

            return [
                'profile' => $this->formatPublicProfile($profile),
                'services' => $services->take(8)->map(fn (Service $service) => [
                    'uuid' => $service->uuid,
                    'name' => $service->name,
                    'category_name' => $service->category?->name,
                    'duration_minutes' => (int) $service->duration_minutes,
                    'price_cents' => (int) $service->price_cents,
                ])->values()->all(),
            ];
        })->values();

        return $this->paginateCollection($results, (int) ($filters['per_page'] ?? 12), (int) ($filters['page'] ?? 1));
    }

    /** @return list<array<string, mixed>> */
    public function featured(int $limit = 8): array
    {
        return FeaturedListing::query()
            ->with(['tenant.marketplaceProfile', 'tenant.services', 'tenant.locations'])
            ->whereIn('status', ['scheduled', 'active'])
            ->where(function ($query) {
                $query->whereNull('starts_at')->orWhere('starts_at', '<=', now());
            })
            ->where(function ($query) {
                $query->whereNull('ends_at')->orWhere('ends_at', '>=', now());
            })
            ->orderByDesc('is_sponsored')
            ->orderBy('starts_at')
            ->limit($limit)
            ->get()
            ->map(function (FeaturedListing $listing) {
                return [
                    'listing' => [
                        'uuid' => $listing->uuid,
                        'placement' => $listing->placement,
                        'status' => $listing->status?->value ?? $listing->status,
                        'is_sponsored' => (bool) $listing->is_sponsored,
                    ],
                    'profile' => $listing->tenant?->marketplaceProfile
                        ? $this->formatPublicProfile($listing->tenant->marketplaceProfile)
                        : null,
                ];
            })
            ->filter(fn (array $row) => $row['profile'] !== null)
            ->values()
            ->all();
    }

    /** @return array<string, mixed> */
    public function formatAdminProfile(MarketplaceProfile $profile): array
    {
        $tenant = $profile->tenantModel ?: Tenant::query()->find($profile->tenant_id);

        return [
            'uuid' => $profile->uuid,
            'headline' => $profile->headline,
            'bio' => $profile->bio,
            'categories' => $profile->categories ?? [],
            'photos' => $profile->photos ?? [],
            'is_published' => (bool) $profile->is_published,
            'average_rating' => (float) $profile->average_rating,
            'review_count' => (int) $profile->review_count,
            'published_at' => $profile->published_at?->toIso8601String(),
            'tenant' => $tenant ? [
                'id' => $tenant->id,
                'uuid' => $tenant->uuid,
                'slug' => $tenant->slug,
                'name' => $tenant->name,
            ] : null,
        ];
    }

    /** @return array<string, mixed> */
    public function formatPublicProfile(MarketplaceProfile $profile, ?float $distanceKm = null): array
    {
        $tenant = $profile->tenantModel ?: Tenant::query()->find($profile->tenant_id);
        $services = $tenant?->services?->take(6) ?? collect();
        $locations = $tenant?->locations?->take(3) ?? collect();

        return [
            'uuid' => $profile->uuid,
            'tenant_slug' => $tenant?->slug,
            'business_name' => $tenant?->name,
            'headline' => $profile->headline,
            'bio' => $profile->bio,
            'categories' => $profile->categories ?? [],
            'photos' => $profile->photos ?? [],
            'average_rating' => (float) $profile->average_rating,
            'review_count' => (int) $profile->review_count,
            'city' => $tenant?->city,
            'country' => $tenant?->country,
            'distance_km' => $distanceKm !== null ? round($distanceKm, 2) : null,
            'services' => $services->map(fn (Service $service) => [
                'uuid' => $service->uuid,
                'name' => $service->name,
                'price_cents' => (int) $service->price_cents,
                'duration_minutes' => (int) $service->duration_minutes,
            ])->values()->all(),
            'locations' => $locations->map(fn ($location) => [
                'uuid' => $location->uuid,
                'name' => $location->name,
                'city' => $location->city,
            ])->values()->all(),
        ];
    }

    /** @return Collection<int, MarketplaceProfile> */
    private function publishedProfiles(): Collection
    {
        return MarketplaceProfile::query()
            ->with([
                'tenantModel',
                'tenantModel.services.category',
                'tenantModel.locations',
            ])
            ->whereBool('is_published', true)
            ->get()
            ->filter(fn (MarketplaceProfile $profile) => $profile->tenantModel !== null);
    }

    /** @return array{data: list<array<string, mixed>>, meta: array<string, int>} */
    private function paginateCollection(Collection $items, int $perPage, int $page): array
    {
        $perPage = max(1, min($perPage, 50));
        $page = max(1, $page);
        $paginator = new Paginator(
            $items->forPage($page, $perPage)->values()->all(),
            $items->count(),
            $perPage,
            $page
        );

        return [
            'data' => $paginator->items(),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ];
    }

    private function distanceKm(float $fromLat, float $fromLng, float $toLat, float $toLng): float
    {
        if ($toLat === 0.0 && $toLng === 0.0) {
            return INF;
        }

        $earthRadius = 6371;
        $latDelta = deg2rad($toLat - $fromLat);
        $lngDelta = deg2rad($toLng - $fromLng);

        $a = sin($latDelta / 2) ** 2
            + cos(deg2rad($fromLat)) * cos(deg2rad($toLat)) * sin($lngDelta / 2) ** 2;

        return $earthRadius * (2 * asin(min(1, sqrt($a))));
    }
}
