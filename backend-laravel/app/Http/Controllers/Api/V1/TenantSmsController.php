<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\SmsMessageResource;
use App\Models\SmsMessage;
use App\Http\Resources\SmsWalletResource;
use App\Http\Resources\SmsWalletTransactionResource;
use App\Models\SmsWalletTransaction;
use App\Services\SmsService;
use App\Services\SmsWalletService;
use App\Support\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TenantSmsController extends Controller
{
    public function __construct(
        protected SmsService $sms,
        protected SmsWalletService $wallet,
    ) {}

    public function wallet(): JsonResponse
    {
        $tenantId = TenantContext::id();
        $wallet = $this->wallet->walletFor($tenantId);
        $wallet->load('tenant:id,name,slug');

        return response()->json([
            'data' => new SmsWalletResource($wallet),
            'usage' => $this->sms->tenantUsage($tenantId),
        ]);
    }

    public function walletTransactions(Request $request): JsonResponse
    {
        $tenantId = TenantContext::id();

        $paginated = SmsWalletTransaction::query()
            ->where('tenant_id', $tenantId)
            ->orderByDesc('created_at')
            ->paginate(min($request->integer('per_page', 30), 100));

        return response()->json([
            'data' => SmsWalletTransactionResource::collection($paginated),
            'meta' => [
                'current_page' => $paginated->currentPage(),
                'last_page' => $paginated->lastPage(),
                'total' => $paginated->total(),
            ],
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        $tenantId = TenantContext::id();

        $query = SmsMessage::query()
            ->where('tenant_id', $tenantId)
            ->orderByDesc('created_at');

        if ($request->filled('status')) {
            $query->where('status', $request->string('status')->toString());
        }

        if ($type = $request->string('type')->trim()->toString()) {
            $query->where('type', $type);
        }

        if ($search = $request->string('q')->trim()->toString()) {
            $query->where('recipient', 'like', "%{$search}%");
        }

        $paginated = $query->paginate(min($request->integer('per_page', 20), 50));

        $base = SmsMessage::query()->where('tenant_id', $tenantId);

        return response()->json([
            'data' => SmsMessageResource::collection($paginated),
            'meta' => [
                'current_page' => $paginated->currentPage(),
                'last_page' => $paginated->lastPage(),
                'total' => $paginated->total(),
            ],
            'summary' => [
                'usage' => $this->sms->tenantUsage($tenantId),
                'total' => (clone $base)->count(),
                'sent' => (clone $base)->where('status', 'sent')->count(),
                'queued' => (clone $base)->where('status', 'queued')->count(),
                'failed' => (clone $base)->whereIn('status', ['failed', 'error'])->count(),
            ],
        ]);
    }
}
