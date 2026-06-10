<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\TenantWalletResource;
use App\Http\Resources\TenantWalletTransactionResource;
use App\Models\Tenant;
use App\Models\TenantWalletTransaction;
use App\Services\TenantWalletService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class TenantWalletController extends Controller
{
    public function __construct(
        protected TenantWalletService $wallets,
    ) {}

    public function show(Request $request, string $tenantSlug): JsonResponse
    {
        $tenant = $this->resolveTenant($request, $tenantSlug);
        $wallet = $this->wallets->walletFor($tenant);

        return response()->json([
            'data' => new TenantWalletResource($wallet),
        ]);
    }

    public function transactions(Request $request, string $tenantSlug): JsonResponse
    {
        $tenant = $this->resolveTenant($request, $tenantSlug);
        $wallet = $this->wallets->walletFor($tenant);

        $paginated = TenantWalletTransaction::query()
            ->where('wallet_id', $wallet->id)
            ->with('createdBy:id,name')
            ->when($request->filled('type'), fn ($q) => $q->where('type', $request->string('type')))
            ->orderByDesc('created_at')
            ->paginate(min($request->integer('per_page', 30), 100));

        return response()->json([
            'data' => TenantWalletTransactionResource::collection($paginated),
            'meta' => [
                'current_page' => $paginated->currentPage(),
                'last_page' => $paginated->lastPage(),
                'total' => $paginated->total(),
            ],
        ]);
    }

    public function export(Request $request, string $tenantSlug): StreamedResponse
    {
        $tenant = $this->resolveTenant($request, $tenantSlug);
        $wallet = $this->wallets->walletFor($tenant);

        $filename = "wallet-transactions-{$tenant->slug}-".now()->format('Y-m-d').'.csv';

        return response()->streamDownload(function () use ($wallet, $request) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, ['date', 'type', 'direction', 'amount_cents', 'balance_after', 'reference', 'description']);

            TenantWalletTransaction::query()
                ->where('wallet_id', $wallet->id)
                ->when($request->filled('type'), fn ($q) => $q->where('type', $request->string('type')))
                ->orderByDesc('created_at')
                ->chunk(200, function ($rows) use ($handle) {
                    foreach ($rows as $row) {
                        fputcsv($handle, [
                            $row->created_at?->toIso8601String(),
                            $row->type instanceof \BackedEnum ? $row->type->value : $row->type,
                            $row->direction instanceof \BackedEnum ? $row->direction->value : $row->direction,
                            $row->amount,
                            $row->balance_after,
                            $row->reference,
                            $row->description,
                        ]);
                    }
                });

            fclose($handle);
        }, $filename, [
            'Content-Type' => 'text/csv',
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
