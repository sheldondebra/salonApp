<?php

namespace App\Services;

use App\Models\Service;
use App\Models\ServiceCategory;
use App\Models\Tenant;
use InvalidArgumentException;

class BusinessTypeService
{
    /**
     * @return list<array{key: string, label: string, description: string, icon: string}>
     */
    public function listForApi(): array
    {
        return collect(config('business_types.types', []))
            ->map(fn (array $meta, string $key) => [
                'key' => $key,
                'label' => $meta['label'],
                'description' => $meta['description'] ?? '',
                'icon' => $meta['icon'] ?? 'store',
            ])
            ->values()
            ->all();
    }

    public function label(?string $key): ?string
    {
        if (! $key) {
            return null;
        }

        return config("business_types.types.{$key}.label");
    }

    public function assertValid(string $key): void
    {
        if (! config("business_types.types.{$key}")) {
            throw new InvalidArgumentException('Please select a valid business type.');
        }
    }

    /**
     * @param  list<string>  $typeKeys
     */
    public function applyMany(Tenant $tenant, array $typeKeys, bool $seedCatalog = true): Tenant
    {
        $typeKeys = array_values(array_unique(array_filter($typeKeys)));

        if ($typeKeys === []) {
            throw new InvalidArgumentException('Select at least one business type.');
        }

        foreach ($typeKeys as $key) {
            $this->assertValid($key);
        }

        $primary = $typeKeys[0];
        $meta = config("business_types.types.{$primary}");
        $settings = $tenant->settings ?? [];
        $settings['business_type'] = $primary;
        $settings['business_types'] = $typeKeys;

        $updates = ['settings' => $settings];

        if (! $tenant->tagline && ! empty($meta['suggested_tagline'])) {
            $updates['tagline'] = $meta['suggested_tagline'];
        }

        $tenant->update($updates);
        $tenant->refresh();

        if ($seedCatalog && ! $tenant->serviceCategories()->exists()) {
            $this->seedFromTypes($tenant, $typeKeys);
        }

        return $tenant->fresh();
    }

    /** @deprecated */
    public function apply(Tenant $tenant, string $typeKey, bool $seedCategories = true): Tenant
    {
        return $this->applyMany($tenant, [$typeKey], $seedCategories);
    }

    /**
     * @param  list<string>  $typeKeys
     */
    public function seedFromTypes(Tenant $tenant, array $typeKeys): void
    {
        $sort = 0;

        foreach ($typeKeys as $typeKey) {
            foreach (config("business_types.types.{$typeKey}.default_categories", []) as $name) {
                ServiceCategory::query()->firstOrCreate(
                    ['tenant_id' => $tenant->id, 'name' => $name],
                    ['sort_order' => ++$sort, 'is_active' => true]
                );
            }
        }

        if ($tenant->services()->exists()) {
            return;
        }

        $categories = $tenant->serviceCategories()->orderBy('sort_order')->get();

        foreach ($typeKeys as $typeKey) {
            $templates = config("business_types.types.{$typeKey}.default_services", []);
            foreach ($templates as $template) {
                $category = $categories->get((int) ($template['category_index'] ?? 0));
                $exists = Service::query()
                    ->where('tenant_id', $tenant->id)
                    ->where('name', $template['name'])
                    ->exists();
                if ($exists) {
                    continue;
                }
                Service::query()->create([
                    'tenant_id' => $tenant->id,
                    'service_category_id' => $category?->id,
                    'name' => $template['name'],
                    'description' => $template['description'] ?? null,
                    'duration_minutes' => (int) ($template['duration_minutes'] ?? 60),
                    'price_cents' => (int) ($template['price_cents'] ?? 0),
                    'is_active' => true,
                ]);
            }
        }
    }

    /**
     * @param  list<string>  $typeKeys
     * @return list<array<string, mixed>>
     */
    public function suggestedServices(array $typeKeys): array
    {
        $out = [];
        foreach ($typeKeys as $typeKey) {
            if (! config("business_types.types.{$typeKey}")) {
                continue;
            }
            foreach (config("business_types.types.{$typeKey}.default_services", []) as $svc) {
                $out[] = array_merge($svc, ['business_type' => $typeKey]);
            }
        }

        return $out;
    }
}
