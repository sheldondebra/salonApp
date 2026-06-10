<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\V1\Concerns\ResolvesTenantFromRequest;
use App\Http\Controllers\Controller;
use App\Models\GiftCard;
use App\Services\GiftCardService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GiftCardController extends Controller
{
    use ResolvesTenantFromRequest;

    public function __construct(
        private readonly GiftCardService $giftCards,
    ) {}

    public function index(Request $request, string $tenantSlug): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);
        $filters = $request->validate([
            'q' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', 'string', 'max:32'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        $paginator = $this->giftCards->paginateCards($tenant->id, $filters, (int) ($filters['per_page'] ?? 20));

        return response()->json([
            'data' => collect($paginator->items())->map(fn (GiftCard $card) => $this->giftCards->formatCard($card)),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }

    public function sell(Request $request, string $tenantSlug): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);
        $data = $request->validate([
            'code' => ['nullable', 'string', 'max:32'],
            'amount_cents' => ['required', 'integer', 'min:1'],
            'recipient_email' => ['nullable', 'email', 'max:255'],
            'recipient_name' => ['nullable', 'string', 'max:255'],
            'purchaser_user_id' => ['nullable', 'integer', 'exists:users,id'],
            'client_user_id' => ['nullable', 'integer', 'exists:users,id'],
            'sale_id' => ['nullable', 'integer', 'exists:sales,id'],
            'expires_at' => ['nullable', 'date'],
        ]);

        $card = $this->giftCards->sell($tenant->id, $data, $request->user());

        return response()->json(['data' => $this->giftCards->formatCard($card)], 201);
    }

    public function showByCode(Request $request, string $tenantSlug, string $code): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);
        $card = $this->giftCards->lookupByCode($tenant->id, $code);

        return response()->json(['data' => $this->giftCards->formatCard($card)]);
    }

    public function redeem(Request $request, string $tenantSlug, GiftCard $giftCard): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);
        abort_unless($giftCard->tenant_id === $tenant->id, 404);

        $data = $request->validate([
            'amount_cents' => ['required', 'integer', 'min:1'],
            'sale_id' => ['nullable', 'integer', 'exists:sales,id'],
            'note' => ['nullable', 'string', 'max:1000'],
        ]);

        $card = $this->giftCards->redeem($giftCard, (int) $data['amount_cents'], $request->user(), $data['sale_id'] ?? null, $data['note'] ?? null);

        return response()->json(['data' => $this->giftCards->formatCard($card)]);
    }

    public function adjust(Request $request, string $tenantSlug, GiftCard $giftCard): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);
        abort_unless($giftCard->tenant_id === $tenant->id, 404);

        $data = $request->validate([
            'amount_cents' => ['required', 'integer'],
            'note' => ['nullable', 'string', 'max:1000'],
        ]);

        $card = $this->giftCards->adjust($giftCard, (int) $data['amount_cents'], $request->user(), $data['note'] ?? null);

        return response()->json(['data' => $this->giftCards->formatCard($card)]);
    }

    public function liabilitySummary(Request $request, string $tenantSlug): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);

        return response()->json(['data' => $this->giftCards->liabilitySummary($tenant->id)]);
    }

    public function lookupQuery(Request $request, string $tenantSlug): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);
        $code = (string) $request->query('code', '');
        abort_unless($code !== '', 422, 'Code is required.');

        $card = $this->giftCards->lookupByCode($tenant->id, $code);

        return response()->json(['data' => $this->giftCards->formatCard($card)]);
    }
}
