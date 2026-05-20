<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Integrations\Payments\FlutterwaveGateway;
use App\Integrations\Payments\PaystackGateway;
use App\Services\PaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymentWebhookController extends Controller
{
    public function __construct(
        protected PaymentService $payments,
    ) {}

    public function paystack(Request $request, PaystackGateway $gateway): JsonResponse
    {
        $payload = $request->getContent();
        $signature = $request->header('x-paystack-signature');

        if ($gateway->isConfigured() && ! $gateway->verifyWebhookSignature($payload, $signature)) {
            return response()->json(['message' => 'Invalid signature'], 401);
        }

        $data = $request->all();
        $this->processWebhookPayload($gateway, $data);

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
        $this->processWebhookPayload($gateway, $data);

        return response()->json(['received' => true]);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    protected function processWebhookPayload(\App\Integrations\Payments\PaymentGatewayContract $gateway, array $data): void
    {
        $reference = $gateway->handleWebhook($data);

        if ($reference) {
            $this->payments->reconcileByReference($reference);

            return;
        }

        $event = (string) ($data['event'] ?? '');
        $status = (string) ($data['data']['status'] ?? '');
        $failed = str_contains(strtolower($event), 'fail') || $status === 'failed';

        if (! $failed) {
            return;
        }

        $failedReference = $data['data']['reference'] ?? $data['data']['tx_ref'] ?? null;

        if (is_string($failedReference) && $failedReference !== '') {
            $this->payments->reconcileFailureByReference($failedReference, $data);
        }
    }
}
