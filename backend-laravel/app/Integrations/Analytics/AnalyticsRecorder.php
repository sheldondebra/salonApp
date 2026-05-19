<?php

namespace App\Integrations\Analytics;

use App\Models\AnalyticsEvent;
use App\Support\TenantContext;

class AnalyticsRecorder
{
    /**
     * @param  array<string, mixed>  $properties
     */
    public function record(string $eventName, array $properties = [], ?string $source = 'api'): AnalyticsEvent
    {
        return AnalyticsEvent::query()->create([
            'tenant_id' => TenantContext::id(),
            'event_name' => $eventName,
            'source' => $source,
            'properties' => $properties,
            'occurred_at' => now(),
        ]);
    }
}
