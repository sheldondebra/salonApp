<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OtpController extends Controller
{
    public function send(Request $request, NotificationService $notifications): JsonResponse
    {
        $validated = $request->validate([
            'phone' => ['required', 'string', 'max:30'],
            'email' => ['nullable', 'email', 'max:255'],
        ]);

        $tenant = $request->attributes->get('tenant');
        $tenantId = $tenant instanceof Tenant ? $tenant->id : null;

        $notifications->sendOtp(
            $validated['phone'],
            $validated['email'] ?? null,
            $tenantId,
        );

        return response()->json([
            'message' => 'Verification code sent',
        ]);
    }

    public function verify(Request $request, NotificationService $notifications): JsonResponse
    {
        $validated = $request->validate([
            'phone' => ['required', 'string', 'max:30'],
            'email' => ['nullable', 'email', 'max:255'],
            'code' => ['required', 'string', 'min:4', 'max:10'],
        ]);

        $verified = $notifications->verifyOtp(
            $validated['phone'],
            $validated['code'],
            $validated['email'] ?? null,
        );

        if (! $verified) {
            return response()->json([
                'message' => 'Invalid or expired verification code',
                'verified' => false,
            ], 422);
        }

        return response()->json([
            'message' => 'Phone verified',
            'verified' => true,
        ]);
    }
}
