<?php

namespace App\Services;

use App\Enums\MarketingIntegrationProvider;
use App\Models\MarketingIntegration;
use App\Models\TrackingEvent;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Validation\ValidationException;

class MarketingIntegrationService
{
    /** @return list<array<string, mixed>> */
    public function integrations(int $tenantId): array
    {
        return collect(MarketingIntegrationProvider::cases())
            ->map(function (MarketingIntegrationProvider $provider) use ($tenantId) {
                $integration = MarketingIntegration::query()->firstOrCreate(
                    ['tenant_id' => $tenantId, 'provider' => $provider],
                    [
                        'config' => [],
                        'is_active' => false,
                        'consent_required' => true,
                    ]
                );

                return $this->formatIntegration($integration);
            })
            ->all();
    }

    public function updateIntegration(int $tenantId, MarketingIntegrationProvider $provider, array $data): MarketingIntegration
    {
        $integration = MarketingIntegration::query()->firstOrCreate(
            ['tenant_id' => $tenantId, 'provider' => $provider],
            [
                'config' => [],
                'is_active' => false,
                'consent_required' => true,
            ]
        );

        $config = is_array($integration->config) ? $integration->config : [];
        $incoming = is_array($data['config'] ?? null) ? $data['config'] : [];

        $integration->update([
            'config' => array_merge($config, array_filter($incoming, fn ($value) => $value !== null)),
            'is_active' => $data['is_active'] ?? $integration->is_active,
            'consent_required' => $data['consent_required'] ?? $integration->consent_required,
        ]);

        return $integration->fresh();
    }

    public function paginateEvents(int $tenantId, array $filters = [], int $perPage = 20): LengthAwarePaginator
    {
        $query = TrackingEvent::query()
            ->where('tenant_id', $tenantId)
            ->latest();

        if (! empty($filters['provider'])) {
            $query->where('provider', $filters['provider']);
        }

        if (! empty($filters['event_name'])) {
            $query->where('event_name', $filters['event_name']);
        }

        if (! empty($filters['q'])) {
            $term = '%'.$filters['q'].'%';
            $query->where(function ($inner) use ($term) {
                $inner->where('event_name', 'like', $term)
                    ->orWhere('session_id', 'like', $term);
            });
        }

        return $query->paginate(min($perPage, 50));
    }

    public function trackEvent(int $tenantId, array $data): TrackingEvent
    {
        $provider = MarketingIntegrationProvider::tryFrom((string) $data['provider']);
        if (! $provider) {
            throw ValidationException::withMessages([
                'provider' => ['Unsupported marketing provider.'],
            ]);
        }

        $integration = MarketingIntegration::query()->firstOrCreate(
            ['tenant_id' => $tenantId, 'provider' => $provider],
            ['config' => [], 'is_active' => false, 'consent_required' => true]
        );

        if ($integration->consent_required && empty($data['consent_granted'])) {
            throw ValidationException::withMessages([
                'consent_granted' => ['Tracking consent is required for this provider.'],
            ]);
        }

        return TrackingEvent::query()->create([
            'tenant_id' => $tenantId,
            'provider' => $provider->value,
            'event_name' => $data['event_name'],
            'payload' => $data['payload'] ?? [],
            'session_id' => $data['session_id'] ?? null,
        ]);
    }

    /** @return array<string, mixed> */
    public function formatIntegration(MarketingIntegration $integration): array
    {
        $config = is_array($integration->config) ? $integration->config : [];

        return [
            'id' => $integration->id,
            'provider' => $integration->provider?->value ?? (string) $integration->provider,
            'is_active' => (bool) $integration->is_active,
            'consent_required' => (bool) $integration->consent_required,
            'config' => $config,
            'measurement_id' => $config['measurement_id'] ?? null,
            'pixel_id' => $config['pixel_id'] ?? null,
            'conversion_event' => $config['conversion_event'] ?? 'booking_completed',
            'updated_at' => $integration->updated_at?->toIso8601String(),
        ];
    }

    /** @return array<string, mixed> */
    public function formatEvent(TrackingEvent $event): array
    {
        return [
            'id' => $event->id,
            'provider' => $event->provider,
            'event_name' => $event->event_name,
            'payload' => $event->payload ?? [],
            'session_id' => $event->session_id,
            'created_at' => $event->created_at?->toIso8601String(),
        ];
    }
}
