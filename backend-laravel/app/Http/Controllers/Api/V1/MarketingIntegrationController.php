<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\MarketingIntegrationProvider;
use App\Http\Controllers\Api\V1\Concerns\ResolvesTenantFromRequest;
use App\Http\Controllers\Controller;
use App\Models\TrackingEvent;
use App\Services\MarketingIntegrationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class MarketingIntegrationController extends Controller
{
    use ResolvesTenantFromRequest;

    public function __construct(
        private readonly MarketingIntegrationService $marketing,
    ) {}

    public function index(Request $request, string $tenantSlug): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);

        return response()->json([
            'data' => $this->marketing->integrations($tenant->id),
        ]);
    }

    public function update(Request $request, string $tenantSlug, string $provider): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);
        $providerEnum = MarketingIntegrationProvider::tryFrom($provider);
        abort_unless($providerEnum !== null, 404);

        $data = $request->validate([
            'is_active' => ['sometimes', 'boolean'],
            'consent_required' => ['sometimes', 'boolean'],
            'config' => ['nullable', 'array'],
            'config.measurement_id' => ['nullable', 'string', 'max:128'],
            'config.pixel_id' => ['nullable', 'string', 'max:128'],
            'config.conversion_event' => ['nullable', 'string', 'max:128'],
        ]);

        $integration = $this->marketing->updateIntegration($tenant->id, $providerEnum, $data);

        return response()->json([
            'data' => $this->marketing->formatIntegration($integration),
            'message' => 'Marketing integration saved',
        ]);
    }

    public function events(Request $request, string $tenantSlug): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);
        $filters = $request->validate([
            'provider' => ['nullable', Rule::in(MarketingIntegrationProvider::values())],
            'event_name' => ['nullable', 'string', 'max:64'],
            'q' => ['nullable', 'string', 'max:100'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        $paginator = $this->marketing->paginateEvents($tenant->id, $filters, (int) ($filters['per_page'] ?? 20));

        return response()->json([
            'data' => collect($paginator->items())->map(fn (TrackingEvent $event) => $this->marketing->formatEvent($event))->values(),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }

    public function storeEvent(Request $request, string $tenantSlug): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);
        $data = $request->validate([
            'provider' => ['required', Rule::in(MarketingIntegrationProvider::values())],
            'event_name' => ['required', 'string', 'max:64'],
            'payload' => ['nullable', 'array'],
            'session_id' => ['nullable', 'string', 'max:255'],
            'consent_granted' => ['sometimes', 'boolean'],
        ]);

        $event = $this->marketing->trackEvent($tenant->id, $data);

        return response()->json([
            'data' => $this->marketing->formatEvent($event),
        ], 201);
    }
}
