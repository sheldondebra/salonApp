<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\WalletTransactionDirection;
use App\Http\Controllers\Controller;
use App\Http\Resources\TenantWalletResource;
use App\Http\Resources\TenantWalletTransactionResource;
use App\Models\Tenant;
use App\Models\TenantWallet;
use App\Services\TenantWalletService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AdminTenantWalletController extends Controller
{
    public function __construct(
        protected TenantWalletService $wallets,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $paginated = TenantWallet::query()
            ->withoutGlobalScope('tenant')
            ->with('tenant:id,name,slug')
            ->orderByDesc('updated_at')
            ->paginate(min($request->integer('per_page', 50), 100));

        return response()->json([
            'data' => TenantWalletResource::collection($paginated),
            'meta' => [
                'current_page' => $paginated->currentPage(),
                'last_page' => $paginated->lastPage(),
                'total' => $paginated->total(),
            ],
        ]);
    }

    public function adjust(Request $request, Tenant $tenant): JsonResponse
    {
        $validated = $request->validate([
            'direction' => ['required', Rule::in(WalletTransactionDirection::values())],
            'amount_cents' => ['required', 'integer', 'min:1'],
            'reference' => ['required', 'string', 'max:64'],
            'description' => ['nullable', 'string', 'max:500'],
        ]);

        $wallet = $this->wallets->walletFor($tenant);

        $tx = $this->wallets->adminAdjust(
            $wallet,
            WalletTransactionDirection::from($validated['direction']),
            (int) $validated['amount_cents'],
            $validated['reference'],
            $validated['description'] ?? null,
            $request->user()->id,
        );

        return response()->json([
            'data' => new TenantWalletTransactionResource($tx->load('createdBy:id,name')),
            'wallet' => new TenantWalletResource($wallet->fresh()),
            'message' => 'Wallet adjusted.',
        ]);
    }
}
