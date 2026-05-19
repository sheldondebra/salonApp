<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\SocialAuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;

class SocialAuthController extends Controller
{
    public function __construct(
        protected SocialAuthService $socialAuth,
    ) {}

    public function redirect(string $provider): JsonResponse
    {
        try {
            return response()->json([
                'url' => $this->socialAuth->redirectUrl($provider),
            ]);
        } catch (\Throwable $e) {
            return response()->json(['message' => $e->getMessage()], 503);
        }
    }

    public function callback(string $provider): RedirectResponse
    {
        $frontend = rtrim(config('services.frontend.url'), '/');

        try {
            $user = $this->socialAuth->handleCallback($provider);
            $user->tokens()->where('name', 'api')->delete();
            $token = $user->createToken('api')->plainTextToken;

            return redirect("{$frontend}/auth/callback?token=".urlencode($token));
        } catch (\Throwable $e) {
            return redirect("{$frontend}/login?error=".urlencode($e->getMessage()));
        }
    }
}
