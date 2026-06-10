<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Integrations\MtnMomo\MtnMomoService;
use App\Models\PaymentRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MtnMomoWebhookController extends Controller
{
    public function callback(Request $request, MtnMomoService $mtn): JsonResponse
    {
        $transactionUuid = $request->header('X-Reference-Id')
            ?? $request->input('referenceId')
            ?? $request->input('transaction_uuid');

        if (! is_string($transactionUuid) || $transactionUuid === '') {
            return response()->json(['message' => 'Missing transaction reference'], 422);
        }

        $paymentRequest = $mtn->handleCallback($transactionUuid, $request->all());

        if (! $paymentRequest) {
            return response()->json(['message' => 'Unknown transaction reference'], 404);
        }

        return response()->json(['received' => true]);
    }
}
