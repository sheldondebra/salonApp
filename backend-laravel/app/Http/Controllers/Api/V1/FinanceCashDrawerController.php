<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\V1\Concerns\ResolvesTenantFromRequest;
use App\Http\Controllers\Controller;
use App\Models\CashDrawerSession;
use App\Services\CashDrawerService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class FinanceCashDrawerController extends Controller
{
    use ResolvesTenantFromRequest;

    public function __construct(
        private readonly CashDrawerService $drawers,
    ) {}

    public function active(Request $request, string $tenantSlug): JsonResponse
    {
        $this->authorize('viewFinance');
        $tenant = $this->tenant($request, $tenantSlug);

        $data = $request->validate([
            'location_id' => ['required', 'integer', 'exists:locations,id'],
        ]);

        $session = $this->drawers->activeSession($tenant->id, (int) $data['location_id']);

        return response()->json([
            'data' => $session
                ? $this->drawers->formatSession($session, includeLive: true)
                : null,
        ]);
    }

    public function index(Request $request, string $tenantSlug): JsonResponse
    {
        $this->authorize('viewFinance');
        $tenant = $this->tenant($request, $tenantSlug);

        $filters = $request->validate([
            'location_id' => ['nullable', 'integer'],
            'status' => ['nullable', 'string', Rule::in(['open', 'closed', 'discrepancy'])],
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date', 'after_or_equal:from'],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $paginator = $this->drawers->paginate(
            $tenant->id,
            $filters,
            (int) ($filters['per_page'] ?? 20),
        );

        return response()->json([
            'data' => collect($paginator->items())
                ->map(fn (CashDrawerSession $session) => $this->drawers->formatSession($session))
                ->values(),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }

    public function show(Request $request, string $tenantSlug, CashDrawerSession $cashDrawerSession): JsonResponse
    {
        $this->authorize('viewFinance');
        $tenant = $this->tenant($request, $tenantSlug);
        abort_unless($cashDrawerSession->tenant_id === $tenant->id, 404);

        return response()->json([
            'data' => $this->drawers->formatSession($cashDrawerSession, includeLive: true),
        ]);
    }

    public function open(Request $request, string $tenantSlug): JsonResponse
    {
        $this->authorize('create', [CashDrawerSession::class]);
        $tenant = $this->tenant($request, $tenantSlug);

        $data = $request->validate([
            'location_id' => ['required', 'integer', 'exists:locations,id'],
            'opening_cash_cents' => ['nullable', 'integer', 'min:0'],
            'opening_notes' => ['nullable', 'string', 'max:5000'],
        ]);

        $session = $this->drawers->open($tenant->id, $data, $request->user());

        return response()->json([
            'data' => $this->drawers->formatSession($session, includeLive: true),
        ], 201);
    }

    public function close(Request $request, string $tenantSlug, CashDrawerSession $cashDrawerSession): JsonResponse
    {
        $this->authorize('create', [CashDrawerSession::class]);
        $tenant = $this->tenant($request, $tenantSlug);
        abort_unless($cashDrawerSession->tenant_id === $tenant->id, 404);

        $data = $request->validate([
            'counted_cash_cents' => ['required', 'integer', 'min:0'],
            'closing_notes' => ['nullable', 'string', 'max:5000'],
        ]);

        $session = $this->drawers->close($cashDrawerSession, $data, $request->user());

        return response()->json([
            'data' => $this->drawers->formatSession($session),
        ]);
    }
}
