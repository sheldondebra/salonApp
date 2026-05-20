<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\SmsMessageResource;
use App\Http\Resources\SmsPackageResource;
use App\Http\Resources\SmsWalletResource;
use App\Http\Resources\SmsWalletTransactionResource;
use App\Models\SmsMessage;
use App\Models\SmsPackage;
use App\Models\SmsWalletTransaction;
use App\Services\SmsPackagePurchaseService;
use App\Services\SmsService;
use App\Services\SmsWalletService;
use App\Support\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use InvalidArgumentException;

class TenantSmsController extends Controller
{
    public function __construct(
        protected SmsService $sms,
        protected SmsWalletService $wallet,
        protected SmsPackagePurchaseService $purchases,
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

    public function packages(): JsonResponse
    {
        $packages = SmsPackage::query()
            ->whereBool('is_active')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        return response()->json(['data' => SmsPackageResource::collection($packages)]);
    }

    public function purchasePackage(Request $request, SmsPackage $smsPackage): JsonResponse
    {
        $validated = $request->validate([
            'provider' => ['nullable', Rule::in(['paystack', 'flutterwave'])],
        ]);

        $tenant = TenantContext::get();
        if (! $tenant) {
            return response()->json(['message' => 'Tenant not resolved.'], 422);
        }

        if (! $smsPackage->is_active) {
            return response()->json(['message' => 'This SMS package is not available.'], 422);
        }

        $user = $request->user();

        try {
            $result = $this->purchases->startPurchase(
                $tenant,
                $smsPackage,
                $user,
                $validated['provider'] ?? 'paystack',
            );
        } catch (InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json([
            'data' => [
                'invoice_id' => $result['invoice']->id,
                'status' => $result['invoice']->status,
                'credits' => $result['invoice']->credits,
                'amount_cents' => $result['invoice']->amount_cents,
                'currency' => $result['invoice']->currency,
                'reference' => $result['reference'],
                'authorization_url' => $result['authorization_url'],
                'demo_mode' => $result['demo_mode'],
                'package' => new SmsPackageResource($result['invoice']->package),
            ],
        ], 201);
    }

    public function verifyPurchase(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'reference' => ['required', 'string', 'max:120'],
        ]);

        try {
            $invoice = $this->purchases->verifyAndFulfill($validated['reference']);
        } catch (InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        $wallet = $this->wallet->walletFor(TenantContext::id());

        return response()->json([
            'message' => 'SMS credits added to your wallet.',
            'invoice' => [
                'id' => $invoice->id,
                'status' => $invoice->status,
                'credits' => $invoice->credits,
            ],
            'wallet' => new SmsWalletResource($wallet),
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
