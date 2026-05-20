<?php

namespace App\Services;

use App\Enums\OnboardingStatus;
use App\Integrations\Payments\PaymentGatewayManager;
use App\Mail\BillingInvoiceMail;
use App\Mail\LoginDetailsMail;
use App\Mail\PaymentReceiptMail;
use App\Mail\WelcomeOnboardingMail;
use App\Models\BillingInvoice;
use App\Models\Coupon;
use App\Models\PlatformPlan;
use App\Models\PlatformSubscription;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use InvalidArgumentException;

class BillingService
{
    public function __construct(
        protected PaymentGatewayManager $gateways,
    ) {}

    public function plan(string $planId): array
    {
        $dbPlan = PlatformPlan::query()
            ->where('slug', $planId)
            ->whereBool('is_active')
            ->first();

        if ($dbPlan) {
            return $dbPlan->toBillingArray();
        }

        $plan = config("billing.plans.{$planId}");

        if (! $plan) {
            throw new InvalidArgumentException('Invalid plan selected.');
        }

        return array_merge(['id' => $planId], $plan);
    }

    public function validateCoupon(?string $code, int $amountCents, ?string $planId = null): array
    {
        $result = app(CouponService::class)->validate($code, [
            'scope' => \App\Enums\CouponScope::Subscription,
            'amount_cents' => $amountCents,
            'plan_id' => $planId,
        ]);

        return [
            'valid' => $result['valid'],
            'discount_cents' => $result['discount_cents'],
            'coupon' => $result['coupon'],
            'message' => $result['message'],
            'final_amount_cents' => $result['final_amount_cents'],
        ];
    }

    public function checkout(User $user, string $planId, ?string $couponCode, string $provider): array
    {
        $plan = $this->plan($planId);

        if (! empty($plan['contact_sales'])) {
            throw new InvalidArgumentException('Enterprise plans require sales contact.');
        }

        $amountCents = (int) $plan['price_cents'];
        $currency = config('billing.currency', 'USD');
        $couponResult = $this->validateCoupon($couponCode, $amountCents);

        if ($couponCode && ! $couponResult['valid']) {
            throw new InvalidArgumentException($couponResult['message'] ?? 'Invalid coupon.');
        }

        $discountCents = $couponResult['discount_cents'];
        $finalCents = max(0, $amountCents - $discountCents);
        $reference = 'sub_'.Str::uuid();

        $subscription = PlatformSubscription::query()->create([
            'user_id' => $user->id,
            'plan_id' => $planId,
            'status' => 'pending',
            'amount_cents' => $amountCents,
            'discount_cents' => $discountCents,
            'final_amount_cents' => $finalCents,
            'currency' => $currency,
            'coupon_id' => $couponResult['coupon']?->id,
            'provider' => $provider,
            'provider_reference' => $reference,
            'metadata' => ['plan_name' => $plan['name']],
        ]);

        $gateway = $this->gateway($provider);

        $init = $gateway->initializePayment([
            'email' => $user->email,
            'name' => $user->name,
            'amount_cents' => $finalCents,
            'currency' => $currency,
            'reference' => $reference,
            'callback_url' => config('billing.frontend_callback'),
            'metadata' => [
                'subscription_uuid' => $subscription->uuid,
                'user_id' => $user->id,
                'plan_id' => $planId,
            ],
        ]);

        return [
            'subscription' => $subscription,
            'authorization_url' => $init['authorization_url'],
            'reference' => $init['reference'],
            'demo_mode' => $init['demo_mode'] ?? false,
            'provider' => $provider,
            'final_amount_cents' => $finalCents,
            'currency' => $currency,
        ];
    }

    public function markPaidByReference(string $reference): ?PlatformSubscription
    {
        $subscription = PlatformSubscription::query()
            ->where('provider_reference', $reference)
            ->first();

        if (! $subscription || $subscription->isPaid()) {
            return $subscription;
        }

        $gateway = $this->gateway($subscription->provider ?? 'paystack');
        $verified = $gateway->verifyPayment($reference);

        if (($verified['status'] ?? '') !== 'success') {
            $subscription->update(['status' => 'failed']);
            app(PaymentService::class)->logSubscriptionFailure(
                $subscription,
                'verification_failed',
                $verified['raw'] ?? []
            );

            return null;
        }

        return $this->completePayment($subscription);
    }

    public function completePayment(PlatformSubscription $subscription): PlatformSubscription
    {
        return DB::transaction(function () use ($subscription) {
            $subscription->refresh();

            if ($subscription->isPaid()) {
                return $subscription;
            }

            $subscription->update([
                'status' => 'paid',
                'paid_at' => now(),
            ]);

            if ($subscription->coupon_id) {
                app(CouponService::class)->recordRedemption(
                    Coupon::query()->find($subscription->coupon_id)
                );
            }

            $user = $subscription->user;
            $user->update([
                'onboarding_status' => OnboardingStatus::Paid,
                'selected_plan' => $subscription->plan_id,
            ]);

            $invoice = $this->createInvoice($subscription);
            $this->sendBillingEmails($user, $subscription, $invoice);

            return $subscription->fresh(['invoice', 'user']);
        });
    }

    protected function createInvoice(PlatformSubscription $subscription): BillingInvoice
    {
        $plan = $this->plan($subscription->plan_id);

        return BillingInvoice::query()->create([
            'user_id' => $subscription->user_id,
            'platform_subscription_id' => $subscription->id,
            'amount_cents' => $subscription->final_amount_cents,
            'currency' => $subscription->currency,
            'status' => 'paid',
            'line_items' => array_values(array_filter([
                [
                    'description' => $plan['name'].' plan ('.$plan['interval'].')',
                    'amount_cents' => $subscription->amount_cents,
                ],
                $subscription->discount_cents > 0 ? [
                    'description' => 'Coupon discount',
                    'amount_cents' => -$subscription->discount_cents,
                ] : null,
            ])),
            'sent_at' => now(),
            'paid_at' => now(),
        ]);
    }

    protected function sendBillingEmails(User $user, PlatformSubscription $subscription, BillingInvoice $invoice): void
    {
        try {
            Mail::to($user->email)->send(new BillingInvoiceMail($user, $subscription, $invoice));
            Mail::to($user->email)->send(new PaymentReceiptMail($user, $subscription, $invoice));
            Mail::to($user->email)->send(new LoginDetailsMail($user));

            $tenant = $user->ownedTenant();
            if ($tenant) {
                Mail::to($user->email)->send(new WelcomeOnboardingMail($user, $tenant));
            }
        } catch (\Throwable) {
            // Log in production; do not block payment completion
        }
    }

    public function gateway(string $provider): \App\Integrations\Payments\PaymentGatewayContract
    {
        return $this->gateways->resolve($provider);
    }
}
