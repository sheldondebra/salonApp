<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Services\PaymentProviderAccountService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminMtnMomoProviderController extends Controller
{
    public function __construct(
        protected PaymentProviderAccountService $providers,
    ) {}

    public function show(): JsonResponse
    {
        $account = $this->providers->platformAccount();

        return response()->json([
            'data' => $this->providers->payload($account),
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'environment' => ['sometimes', 'in:sandbox,production'],
            'country' => ['sometimes', 'string', 'max:8'],
            'currency' => ['sometimes', 'string', 'size:3'],
            'api_user' => ['nullable', 'string', 'max:255'],
            'api_key' => ['nullable', 'string', 'max:255'],
            'subscription_key' => ['nullable', 'string', 'max:255'],
            'target_environment' => ['nullable', 'string', 'max:64'],
            'callback_host' => ['nullable', 'string', 'max:255'],
        ]);

        $account = $this->providers->updateAccount(
            $this->providers->platformAccount(),
            $validated
        );

        return response()->json([
            'data' => $this->providers->payload($account),
            'message' => 'Platform MTN MoMo settings saved.',
        ]);
    }

    public function healthCheck(): JsonResponse
    {
        $result = $this->providers->healthCheck($this->providers->platformAccount());

        return response()->json($result, $result['ok'] ? 200 : 422);
    }
}
