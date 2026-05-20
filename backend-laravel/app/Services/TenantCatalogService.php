<?php

namespace App\Services;

use App\Models\PortfolioGalleryItem;
use App\Models\Service;
use App\Models\Tenant;
use Illuminate\Support\Collection;

class TenantCatalogService
{
    /**
     * @param  list<array<string, mixed>>  $items
     */
    public function syncServices(Tenant $tenant, array $items): Collection
    {
        $updated = collect();

        foreach ($items as $row) {
            $service = null;

            if (! empty($row['id'])) {
                $service = Service::query()
                    ->where('tenant_id', $tenant->id)
                    ->whereKey($row['id'])
                    ->first();
            } elseif (! empty($row['uuid'])) {
                $service = Service::query()
                    ->where('tenant_id', $tenant->id)
                    ->where('uuid', $row['uuid'])
                    ->first();
            }

            if (empty($row['name'])) {
                continue;
            }

            $payload = [
                'name' => $row['name'],
                'description' => $row['description'] ?? null,
                'duration_minutes' => max(5, (int) ($row['duration_minutes'] ?? 60)),
                'price_cents' => max(0, (int) ($row['price_cents'] ?? 0)),
                'service_category_id' => $row['service_category_id'] ?? null,
                'is_active' => $row['is_active'] ?? true,
            ];

            if ($service) {
                $service->update($payload);
            } else {
                $service = Service::query()->create(array_merge($payload, [
                    'tenant_id' => $tenant->id,
                ]));
            }

            $updated->push($service->fresh('category'));
        }

        return $updated;
    }

    /**
     * @param  list<array<string, mixed>>  $items
     */
    public function syncGallery(Tenant $tenant, array $items, bool $replace = false): Collection
    {
        if ($replace) {
            $tenant->portfolioGalleryItems()->delete();
        }

        $created = collect();

        foreach ($items as $index => $row) {
            if (empty($row['before_image_url']) || empty($row['after_image_url'])) {
                continue;
            }

            $item = PortfolioGalleryItem::query()->create([
                'tenant_id' => $tenant->id,
                'service_id' => $row['service_id'] ?? null,
                'title' => $row['title'] ?? null,
                'before_image_url' => $row['before_image_url'],
                'after_image_url' => $row['after_image_url'],
                'caption' => $row['caption'] ?? null,
                'sort_order' => $index + 1,
                'is_published' => $row['is_published'] ?? true,
            ]);

            $created->push($item);
        }

        return $created;
    }
}
