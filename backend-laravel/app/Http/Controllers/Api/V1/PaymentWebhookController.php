<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Integrations\Payments\FlutterwaveGateway;
use App\Integrations\Payments\PaystackGateway;
use App\Services\BillingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymentWebhookController extends Controller
{
    public function __construct(
        protected BillingService $billing,
    ) {}

    public function paystack(Request $request, PaystackGateway $gateway): JsonResponse
    {
        $payload = $request->getContent();
        $signature = $request->header('x-paystack-signature');

        if ($gateway->isConfigured() && ! $gateway->verifyWebhookSignature($payload, $signature)) {
            return response()->json(['message' => 'Invalid signature'], 401);
        }

        $data = $request->all();
        $reference = $gateway->handleWebhook($data);

        if ($reference) {
            $this->billing->markPaidByReference($reference);
        }

        return response()->json(['received' => true]);
    }

    public function flutterwave(Request $request, FlutterwaveGateway $gateway): JsonResponse
    {
        $signature = $request->header('verif-hash');
        $payload = $request->getContent();

        if ($gateway->isConfigured() && ! $gateway->verifyWebhookSignature($payload, $signature)) {
            return response()->json(['message' => 'Invalid signature'], 401);
        }

        $data = $request->all();
        $reference = $gateway->handleWebhook($data);

        if ($reference) {
            $this->billing->markPaidByReference($reference);
        }

        return response()->json(['received' => true]);
    }
}
