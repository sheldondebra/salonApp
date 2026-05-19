<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Enums\OnboardingStatus;
use App\Models\PlatformSubscription;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BillingAdminController extends Controller
{
    public function payments(Request $request): JsonResponse
    {
        $subscriptions = PlatformSubscription::query()
            ->with(['user:id,uuid,name,email', 'coupon:id,code', 'invoice:id,platform_subscription_id,invoice_number,amount_cents,status'])
            ->orderByDesc('created_at')
            ->paginate(20);

        return response()->json($subscriptions);
    }

    public function unpaidSignups(Request $request): JsonResponse
    {
        $users = User::query()
            ->where('account_intent', 'salon_owner')
            ->where('onboarding_status', OnboardingStatus::PaymentPending)
            ->with(['latestSubscription'])
            ->orderByDesc('created_at')
            ->paginate(20);

        return response()->json($users);
    }
}
