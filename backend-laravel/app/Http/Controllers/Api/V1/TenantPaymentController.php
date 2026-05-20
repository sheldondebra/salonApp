<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\PaymentTransactionResource;
use App\Models\PaymentTransaction;
use App\Support\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TenantPaymentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $tenantId = TenantContext::id();

        $transactions = PaymentTransaction::query()
            ->where('tenant_id', $tenantId)
            ->with(['appointment.service', 'appointment.client', 'user:id,name,email'])
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')))
            ->when($request->filled('purpose'), fn ($q) => $q->where('purpose', $request->string('purpose')))
            ->orderByDesc('created_at')
            ->paginate(min($request->integer('per_page', 20), 100));

        $base = PaymentTransaction::query()->where('tenant_id', $tenantId);

        return response()->json([
            'data' => PaymentTransactionResource::collection($transactions),
            'meta' => [
                'current_page' => $transactions->currentPage(),
                'last_page' => $transactions->lastPage(),
                'total' => $transactions->total(),
                'summary' => [
                    'paid' => (clone $base)->where('status', 'paid')->count(),
                    'pending' => (clone $base)->where('status', 'pending')->count(),
                    'failed' => (clone $base)->where('status', 'failed')->count(),
                ],
            ],
        ]);
    }
}
