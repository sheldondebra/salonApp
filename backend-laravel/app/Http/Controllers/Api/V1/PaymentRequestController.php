<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\PaymentRequests\StorePaymentRequestRequest;
use App\Http\Resources\PaymentRequestResource;
use App\Integrations\MtnMomo\MtnMomoService;
use App\Models\PaymentRequest;
use App\Services\PaymentRequestService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymentRequestController extends Controller
{
    public function index(Request $request, PaymentRequestService $service): JsonResponse
    {
        $this->authorize('viewAny', PaymentRequest::class);

        $paginator = $service->list($request->only([
            'status',
            'gateway',
            'reason',
            'customer_id',
            'date_from',
            'date_to',
            'q',
            'per_page',
            'page',
        ]));

        return response()->json([
            'data' => PaymentRequestResource::collection($paginator),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'total' => $paginator->total(),
                'summary' => $service->summary(),
            ],
        ]);
    }

    public function show(PaymentRequest $paymentRequest, PaymentRequestService $service): JsonResponse
    {
        $this->authorize('view', $paymentRequest);

        $record = $service->findForTenant($paymentRequest->id);

        return response()->json([
            'data' => new PaymentRequestResource($record),
        ]);
    }

    public function store(StorePaymentRequestRequest $request, PaymentRequestService $service, MtnMomoService $mtn): JsonResponse
    {
        $this->authorize('create', PaymentRequest::class);

        $record = $service->create($request->validated(), $request->user());

        if ($record->gateway === 'mtn_momo') {
            $record = $mtn->dispatch($record);
        }

        return response()->json([
            'data' => new PaymentRequestResource($record->load([
                'customer:id,name,email,phone',
                'requestedBy:id,name,email',
            ])),
            'message' => $record->gateway === 'mtn_momo'
                ? ($record->status === \App\Enums\PaymentRequestStatus::Processing
                    ? 'MTN MoMo prompt sent. Customer will approve on their own phone — never ask for their PIN.'
                    : 'Payment request created but MTN dispatch failed. Check details or retry.')
                : 'Payment request created. Customer will approve MoMo on their own phone — never ask for their PIN.',
        ], 201);
    }

    public function verify(PaymentRequest $paymentRequest, MtnMomoService $mtn): JsonResponse
    {
        $this->authorize('verify', $paymentRequest);

        $record = $mtn->verify($paymentRequest);

        return response()->json([
            'data' => new PaymentRequestResource($record->load([
                'customer:id,name,email,phone',
                'requestedBy:id,name,email',
            ])),
            'message' => 'Payment status refreshed from MTN.',
        ]);
    }

    public function cancel(PaymentRequest $paymentRequest, MtnMomoService $mtn): JsonResponse
    {
        $this->authorize('cancel', $paymentRequest);

        $record = $mtn->cancel($paymentRequest);

        return response()->json([
            'data' => new PaymentRequestResource($record),
            'message' => 'Payment request cancelled.',
        ]);
    }

    public function retry(PaymentRequest $paymentRequest, MtnMomoService $mtn): JsonResponse
    {
        $this->authorize('retry', $paymentRequest);

        $record = $mtn->retry($paymentRequest);

        return response()->json([
            'data' => new PaymentRequestResource($record->load([
                'customer:id,name,email,phone',
                'requestedBy:id,name,email',
            ])),
            'message' => $record->status === \App\Enums\PaymentRequestStatus::Processing
                ? 'MTN MoMo prompt sent again.'
                : 'Retry failed — check MTN configuration or customer phone.',
        ]);
    }
}
