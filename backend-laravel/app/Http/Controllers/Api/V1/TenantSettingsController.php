<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\TenantResource;
use App\Models\Tenant;
use App\Services\OnboardingService;
use App\Services\SmsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TenantSettingsController extends Controller
{
    public function __construct(
        protected OnboardingService $onboarding,
        protected SmsService $sms,
    ) {}

    public function show(Request $request, string $tenantSlug): JsonResponse
    {
        $tenant = $this->resolveTenant($request, $tenantSlug);

        return response()->json([
            'tenant' => new TenantResource($tenant),
            'onboarding' => $this->onboarding->progressForTenant($tenant),
            'settings' => [
                'multiple_locations' => $tenant->multipleLocationsEnabled(),
                'business_type' => $tenant->businessTypeKey(),
                'business_type_label' => $tenant->businessTypeLabel(),
                'notifications' => $tenant->notificationSettings(),
                'sms_usage' => $this->sms->tenantUsage($tenant->id),
            ],
        ]);
    }

    public function update(Request $request, string $tenantSlug): JsonResponse
    {
        $tenant = $this->resolveTenant($request, $tenantSlug);

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'tagline' => ['nullable', 'string', 'max:255'],
            'business_description' => ['nullable', 'string', 'max:5000'],
            'logo_url' => ['nullable', 'string', 'max:2048'],
            'banner_url' => ['nullable', 'string', 'max:2048'],
            'business_phone' => ['nullable', 'string', 'max:30'],
            'business_email' => ['nullable', 'email', 'max:255'],
            'whatsapp' => ['nullable', 'string', 'max:30'],
            'website_url' => ['nullable', 'string', 'max:2048'],
            'primary_color' => ['nullable', 'string', 'max:20'],
            'accent_color' => ['nullable', 'string', 'max:20'],
            'address_line1' => ['nullable', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:100'],
            'country' => ['nullable', 'string', 'max:100'],
            'timezone' => ['nullable', 'string', 'max:64'],
            'multiple_locations' => ['sometimes', 'boolean'],
            'social' => ['nullable', 'array'],
            'social.instagram' => ['nullable', 'string', 'max:255'],
            'social.facebook' => ['nullable', 'string', 'max:255'],
            'social.tiktok' => ['nullable', 'string', 'max:255'],
            'social.twitter' => ['nullable', 'string', 'max:255'],
            'opening_hours' => ['nullable', 'array'],
            'opening_hours.*.day' => ['required_with:opening_hours', 'string', 'max:10'],
            'opening_hours.*.open' => ['nullable', 'string', 'max:8'],
            'opening_hours.*.close' => ['nullable', 'string', 'max:8'],
            'opening_hours.*.closed' => ['nullable', 'boolean'],
            'notifications' => ['nullable', 'array'],
            'notifications.email_enabled' => ['sometimes', 'boolean'],
            'notifications.sms_enabled' => ['sometimes', 'boolean'],
            'notifications.booking_confirmation_email' => ['sometimes', 'boolean'],
            'notifications.booking_confirmation_sms' => ['sometimes', 'boolean'],
            'notifications.booking_reminder_email' => ['sometimes', 'boolean'],
            'notifications.booking_reminder_sms' => ['sometimes', 'boolean'],
            'notifications.booking_cancellation_email' => ['sometimes', 'boolean'],
            'notifications.booking_cancellation_sms' => ['sometimes', 'boolean'],
            'notifications.payment_alert_email' => ['sometimes', 'boolean'],
            'notifications.payment_alert_sms' => ['sometimes', 'boolean'],
            'notifications.marketing_sms_enabled' => ['sometimes', 'boolean'],
        ]);

        $settings = $tenant->settings ?? [];

        if (array_key_exists('multiple_locations', $validated)) {
            $settings['multiple_locations'] = (bool) $validated['multiple_locations'];
            unset($validated['multiple_locations']);
        }

        foreach (['business_description', 'whatsapp', 'social', 'opening_hours'] as $settingsKey) {
            if (array_key_exists($settingsKey, $validated)) {
                $settings[$settingsKey] = $validated[$settingsKey];
                unset($validated[$settingsKey]);
            }
        }

        if (array_key_exists('notifications', $validated)) {
            $allowed = array_keys(config('notifications.defaults'));
            $incoming = array_intersect_key($validated['notifications'], array_flip($allowed));
            $settings['notifications'] = array_merge(
                is_array($settings['notifications'] ?? null) ? $settings['notifications'] : [],
                $incoming
            );
            unset($validated['notifications']);
        }

        $tenant->update(array_merge(
            array_filter($validated, fn ($v) => $v !== null),
            ['settings' => $settings]
        ));

        return response()->json([
            'tenant' => new TenantResource($tenant->fresh()),
            'message' => 'Settings saved',
        ]);
    }

    protected function resolveTenant(Request $request, string $tenantSlug): Tenant
    {
        /** @var Tenant $tenant */
        $tenant = $request->attributes->get('tenant');

        if ($tenant->slug !== $tenantSlug) {
            abort(404);
        }

        return $tenant;
    }
}
