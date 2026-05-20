<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\SmsWalletTransactionType;
use App\Http\Controllers\Controller;
use App\Http\Resources\SmsWalletResource;
use App\Http\Resources\SmsWalletTransactionResource;
use App\Models\SmsProviderSyncLog;
use App\Models\SmsPurchaseInvoice;
use App\Models\SmsWalletTransaction;
use App\Models\TenantSmsWallet;
use App\Services\SmsProviderSyncService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SmsResellerAdminController extends Controller
{
    public function __construct(
        protected SmsProviderSyncService $providerSync,
    ) {}

    public function overview(): JsonResponse
    {
        $provider = $this->providerSync->providerPayload();
        $wallets = TenantSmsWallet::query()->withoutGlobalScope('tenant')->with('tenant:id,name,slug')->get();

        return response()->json([
            'provider' => $provider,
            'summary' => [
                'tenant_count' => $wallets->count(),
                'total_tenant_balance' => $wallets->sum('balance_credits'),
                'total_tenant_used' => $wallets->sum('total_used'),
                'low_balance_tenants' => $wallets->filter(fn ($w) => $w->isLowBalance())->count(),
            ],
        ]);
    }

    public function provider(): JsonResponse
    {
        return response()->json($this->providerSync->providerPayload());
    }

    public function syncProvider(): JsonResponse
    {
        $result = $this->providerSync->sync();

        return response()->json($result);
    }

    public function syncLogs(Request $request): JsonResponse
    {
        $paginated = SmsProviderSyncLog::query()
            ->where('provider', 'mnotify')
            ->orderByDesc('created_at')
            ->paginate(min($request->integer('per_page', 20), 50));

        return response()->json([
            'data' => $paginated->through(fn (SmsProviderSyncLog $log) => [
                'id' => $log->id,
                'status' => $log->status,
                'balance_before' => $log->balance_before,
                'balance_after' => $log->balance_after,
                'message' => $log->message,
                'created_at' => $log->created_at?->toIso8601String(),
            ]),
            'meta' => [
                'current_page' => $paginated->currentPage(),
                'last_page' => $paginated->lastPage(),
                'total' => $paginated->total(),
            ],
        ]);
    }

    public function wallets(Request $request): JsonResponse
    {
        $query = TenantSmsWallet::query()
            ->withoutGlobalScope('tenant')
            ->with('tenant:id,name,slug')
            ->orderByDesc('balance_credits');

        if ($request->boolean('low_balance_only')) {
            $query->whereColumn('balance_credits', '<=', 'low_balance_threshold');
        }

        if ($search = $request->string('q')->trim()->toString()) {
            $query->whereHas('tenant', fn ($q) => $q->where('name', 'like', "%{$search}%")->orWhere('slug', 'like', "%{$search}%"));
        }

        $wallets = $query->paginate(min($request->integer('per_page', 20), 50));

        return response()->json([
            'data' => SmsWalletResource::collection($wallets),
            'meta' => [
                'current_page' => $wallets->currentPage(),
                'last_page' => $wallets->lastPage(),
                'total' => $wallets->total(),
            ],
        ]);
    }

    public function transactions(Request $request): JsonResponse
    {
        $query = SmsWalletTransaction::query()
            ->withoutGlobalScope('tenant')
            ->with(['performedBy:id,name'])
            ->orderByDesc('created_at');

        if ($request->filled('tenant_id')) {
            $query->where('tenant_id', $request->integer('tenant_id'));
        }

        if ($type = $request->string('type')->trim()->toString()) {
            $query->where('type', $type);
        }

        if ($request->boolean('allocations_only')) {
            $query->whereIn('type', [
                SmsWalletTransactionType::Allocation->value,
                SmsWalletTransactionType::Bonus->value,
                SmsWalletTransactionType::Correction->value,
            ]);
        }

        $paginated = $query->paginate(min($request->integer('per_page', 30), 100));

        return response()->json([
            'data' => SmsWalletTransactionResource::collection($paginated),
            'meta' => [
                'current_page' => $paginated->currentPage(),
                'last_page' => $paginated->lastPage(),
                'total' => $paginated->total(),
            ],
        ]);
    }

    public function purchases(Request $request): JsonResponse
    {
        $query = SmsPurchaseInvoice::query()
            ->withoutGlobalScope('tenant')
            ->with(['tenant:id,name,slug', 'package:id,name,slug'])
            ->orderByDesc('created_at');

        if ($request->filled('status')) {
            $query->where('status', $request->string('status')->toString());
        }

        if ($request->filled('tenant_id')) {
            $query->where('tenant_id', $request->integer('tenant_id'));
        }

        $paginated = $query->paginate(min($request->integer('per_page', 20), 50));

        return response()->json([
            'data' => $paginated->through(fn ($invoice) => [
                'id' => $invoice->id,
                'tenant' => $invoice->tenant ? [
                    'id' => $invoice->tenant->id,
                    'name' => $invoice->tenant->name,
                    'slug' => $invoice->tenant->slug,
                ] : null,
                'package' => $invoice->package ? [
                    'id' => $invoice->package->id,
                    'name' => $invoice->package->name,
                ] : null,
                'credits' => $invoice->credits,
                'amount_cents' => $invoice->amount_cents,
                'currency' => $invoice->currency,
                'status' => $invoice->status,
                'payment_gateway' => $invoice->payment_gateway,
                'provider_reference' => $invoice->provider_reference,
                'paid_at' => $invoice->paid_at?->toIso8601String(),
                'created_at' => $invoice->created_at?->toIso8601String(),
            ]),
            'meta' => [
                'current_page' => $paginated->currentPage(),
                'last_page' => $paginated->lastPage(),
                'total' => $paginated->total(),
            ],
        ]);
    }
}
