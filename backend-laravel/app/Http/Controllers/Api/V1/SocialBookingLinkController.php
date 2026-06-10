<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\V1\Concerns\ResolvesTenantFromRequest;
use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\SocialBookingLink;
use App\Services\SocialBookingLinkService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SocialBookingLinkController extends Controller
{
    use ResolvesTenantFromRequest;

    public function __construct(
        private readonly SocialBookingLinkService $links,
    ) {}

    public function index(Request $request, string $tenantSlug): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);
        $paginator = $this->links->paginate($tenant->id, $request->integer('per_page', 20));

        return response()->json([
            'data' => collect($paginator->items())->map(fn (SocialBookingLink $link) => $this->links->formatLink($link, $tenant))->values(),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }

    public function store(Request $request, string $tenantSlug): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);
        $data = $request->validate([
            'platform' => ['required', 'string', 'max:32'],
            'url' => ['required', 'url', 'max:2048'],
            'utm_source' => ['nullable', 'string', 'max:255'],
            'utm_medium' => ['nullable', 'string', 'max:255'],
            'utm_campaign' => ['nullable', 'string', 'max:255'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $link = $this->links->create($tenant->id, $data);

        return response()->json(['data' => $this->links->formatLink($link, $tenant)], 201);
    }

    public function update(Request $request, string $tenantSlug, SocialBookingLink $socialBookingLink): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);
        abort_unless($socialBookingLink->tenant_id === $tenant->id, 404);

        $data = $request->validate([
            'platform' => ['sometimes', 'string', 'max:32'],
            'url' => ['sometimes', 'url', 'max:2048'],
            'utm_source' => ['nullable', 'string', 'max:255'],
            'utm_medium' => ['nullable', 'string', 'max:255'],
            'utm_campaign' => ['nullable', 'string', 'max:255'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $link = $this->links->update($socialBookingLink, $data);

        return response()->json(['data' => $this->links->formatLink($link, $tenant)]);
    }

    public function destroy(Request $request, string $tenantSlug, SocialBookingLink $socialBookingLink): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);
        abort_unless($socialBookingLink->tenant_id === $tenant->id, 404);

        $this->links->delete($socialBookingLink);

        return response()->json(['message' => 'Social booking link deleted']);
    }

    public function trackClick(Request $request, string $tenantSlug, SocialBookingLink $socialBookingLink): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);
        abort_unless($socialBookingLink->tenant_id === $tenant->id, 404);

        $appointment = null;
        if ($request->filled('appointment_uuid')) {
            $appointment = Appointment::query()
                ->withoutGlobalScope('tenant')
                ->where('tenant_id', $tenant->id)
                ->where('uuid', $request->string('appointment_uuid')->toString())
                ->first();
        }

        return response()->json([
            'data' => $this->links->trackClick(
                $socialBookingLink,
                $appointment,
                $request->headers->get('referer')
            ),
        ]);
    }

    public function storeAttribution(Request $request, string $tenantSlug): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);
        $data = $request->validate([
            'appointment_uuid' => ['required', 'string', 'exists:appointments,uuid'],
            'source' => ['nullable', 'string', 'max:64'],
            'medium' => ['nullable', 'string', 'max:64'],
            'campaign' => ['nullable', 'string', 'max:64'],
            'referrer' => ['nullable', 'string', 'max:2048'],
        ]);

        $appointment = Appointment::query()
            ->withoutGlobalScope('tenant')
            ->where('tenant_id', $tenant->id)
            ->where('uuid', $data['appointment_uuid'])
            ->firstOrFail();

        $attribution = $this->links->storeAttribution($tenant->id, $appointment, $data);

        return response()->json([
            'data' => $this->links->formatAttribution($attribution),
        ], 201);
    }
}
