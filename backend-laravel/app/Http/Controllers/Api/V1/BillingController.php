<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\PlatformPlan;
use App\Services\BillingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class BillingController extends Controller
{
    public function __construct(
        protected BillingService $billing,
    ) {}

    public function plans(): JsonResponse
    {
        $plans = collect(PlatformPlan::billingCatalog())->values();

        return response()->json(['data' => $plans, 'currency' => config('billing.currency')]);
    }

    public function validateCoupon(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'max:50'],
            'plan_id' => ['required', Rule::in(array_keys(PlatformPlan::billingCatalog()))],
        ]);

        $plan = $this->billing->plan($validated['plan_id']);
        $amountCents = (int) ($plan['price_cents'] ?? 0);
        $result = $this->billing->validateCoupon(
            $validated['code'],
            $amountCents,
            $validated['plan_id'],
        );

        return response()->json([
            'valid' => $result['valid'],
            'message' => $result['message'] ?? null,
            'discount_cents' => $result['discount_cents'],
            'final_amount_cents' => $result['final_amount_cents']
                ?? max(0, $amountCents - $result['discount_cents']),
        ]);
    }

    public function checkout(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'plan_id' => ['required', Rule::in(array_keys(PlatformPlan::billingCatalog()))],
            'coupon_code' => ['nullable', 'string', 'max:50'],
            'provider' => ['required', Rule::in(['paystack', 'flutterwave'])],
        ]);

        $user = $request->user();

        if (! $user->needsSubscriptionPayment() && $user->onboarding_status?->value === 'onboarded') {
            return response()->json(['message' => 'Subscription already active'], 422);
        }

        try {
            $result = $this->billing->checkout(
                $user,
                $validated['plan_id'],
                $validated['coupon_code'] ?? null,
                $validated['provider'],
            );
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json([
            'authorization_url' => $result['authorization_url'],
            'reference' => $result['reference'],
            'provider' => $result['provider'],
            'demo_mode' => $result['demo_mode'] ?? false,
            'final_amount_cents' => $result['final_amount_cents'],
            'currency' => $result['currency'],
            'subscription_uuid' => $result['subscription']->uuid,
        ]);
    }

    public function verify(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'reference' => ['required', 'string'],
        ]);

        $subscription = $this->billing->markPaidByReference($validated['reference']);

        if (! $subscription) {
            return response()->json(['message' => 'Payment not verified', 'paid' => false], 402);
        }

        return response()->json([
            'paid' => true,
            'onboarding_status' => $subscription->user->fresh()->onboarding_status?->value,
            'redirect' => '/onboarding',
        ]);
    }

    public function status(Request $request): JsonResponse
    {
        $user = $request->user()->load('latestSubscription.invoice');

        return response()->json([
            'onboarding_status' => $user->onboarding_status?->value ?? 'complete',
            'account_intent' => $user->account_intent,
            'selected_plan' => $user->selected_plan,
            'subscription' => $user->latestSubscription,
        ]);
    }
}
