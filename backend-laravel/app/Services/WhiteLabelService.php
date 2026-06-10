<?php

namespace App\Services;

use App\Models\WhiteLabelSetting;

class WhiteLabelService
{
    public function forTenant(int $tenantId): WhiteLabelSetting
    {
        return WhiteLabelSetting::query()->firstOrCreate(
            ['tenant_id' => $tenantId],
            [
                'mobile_theme' => [],
                'custom_domains' => [],
                'is_enabled' => false,
            ]
        );
    }

    public function update(int $tenantId, array $data): WhiteLabelSetting
    {
        $settings = $this->forTenant($tenantId);

        $settings->update([
            'app_name' => array_key_exists('app_name', $data) ? $data['app_name'] : $settings->app_name,
            'app_tagline' => array_key_exists('app_tagline', $data) ? $data['app_tagline'] : $settings->app_tagline,
            'mobile_theme' => $data['mobile_theme'] ?? $settings->mobile_theme ?? [],
            'custom_domains' => $data['custom_domains'] ?? $settings->custom_domains ?? [],
            'is_enabled' => $data['is_enabled'] ?? $settings->is_enabled,
            'plan_required' => array_key_exists('plan_required', $data) ? $data['plan_required'] : $settings->plan_required,
        ]);

        return $settings->fresh();
    }

    /** @return array<string, mixed> */
    public function format(WhiteLabelSetting $setting): array
    {
        return [
            'app_name' => $setting->app_name,
            'app_tagline' => $setting->app_tagline,
            'mobile_theme' => $setting->mobile_theme ?? [],
            'custom_domains' => $setting->custom_domains ?? [],
            'is_enabled' => (bool) $setting->is_enabled,
            'plan_required' => $setting->plan_required,
            'updated_at' => $setting->updated_at?->toIso8601String(),
        ];
    }
}
