<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\AdminUserPasswordService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserPasswordController extends Controller
{
    public function sendResetLink(Request $request, User $user, AdminUserPasswordService $passwords): JsonResponse
    {
        $this->authorize('update', $user);

        $passwords->sendResetLink($user, $request->user());

        return response()->json([
            'message' => "Password reset link sent to {$user->email}.",
        ]);
    }

    public function resetAndNotify(Request $request, User $user, AdminUserPasswordService $passwords): JsonResponse
    {
        $this->authorize('update', $user);

        $passwords->resetAndNotify($user, $request->user());

        return response()->json([
            'message' => "A new temporary password was emailed to {$user->email}.",
        ]);
    }
}
