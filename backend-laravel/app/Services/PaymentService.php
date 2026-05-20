<?php

namespace App\Services;

use App\Enums\PaymentPurpose;
use App\Services\NotificationService;
use App\Integrations\Payments\PaymentGatewayManager;
use App\Models\Appointment;
use App\Models\PaymentFailureLog;
use App\Models\PaymentTransaction;
use App\Enums\CouponScope;
use App\Models\Coupon;
use App\Models\PlatformSubscription;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use InvalidArgumentException;

class PaymentService
{
    public function __construct(
        protected PaymentGatewayManager $gateways,
    ) {}

    public function reconcileByReference(string $reference): bool
    {
        if (str_starts_with($reference, 'sub_')) {
            return app(BillingService::class)->markPaidByReference($reference) !== null;
        }

        $transaction = PaymentTransaction::query()
            ->where('provider_reference', $reference)
            ->first();

        if (! $transaction) {
            return false;
        }

        if ($transaction->isPaid()) {
            return true;
        }

        $gateway = $this->gateways->resolve($transaction->provider);
        $verified = $gateway->verifyPayment($reference);

        if (($verified['status'] ?? '') !== 'success') {
            $this->markTransactionFailed(
                $transaction,
                'verification_failed',
                $verified['raw'] ?? []
            );

            return false;
        }

        $this->completeTransaction($transaction, $verified['raw'] ?? []);

        return true;
    }

    /**
     * @return array{
     *   authorization_url: string,
     *   reference: string,
     *   provider: string,
     *   demo_mode?: bool,
     *   final_amount_cents: int,
     *   currency: string,
     *   transaction_uuid: string,
     * }
     */
    public function checkoutForAppointment(
        Appointment $appointment,
        string $purpose,
        string $provider,
        string $email,
        ?string $name = null,
        ?string $couponCode = null,
    ): array {
        $purposeEnum = PaymentPurpose::from($purpose);
        $appointment->loadMissing(['service', 'bookingGroup.appointments.service', 'tenant', 'client']);

        $tenant = $appointment->tenant;
        if (! $tenant->paymentsEnabled()) {
            throw new InvalidArgumentException('Online payments are not enabled for this salon.');
        }

        $totalCents = $this->appointmentTotalCents($appointment);
        if ($totalCents <= 0) {
            throw new InvalidArgumentException('This appointment has no payable amount.');
        }

        $amountCents = match ($purposeEnum) {
            PaymentPurpose::Deposit => $this->depositAmountCents($tenant, $totalCents),
            PaymentPurpose::Booking => $totalCents,
            default => throw new InvalidArgumentException('Invalid payment purpose for booking.'),
        };

        if ($amountCents <= 0) {
            throw new InvalidArgumentException('Deposit amount must be greater than zero.');
        }

        $serviceIds = $appointment->bookingGroup
            ? $appointment->bookingGroup->appointments->pluck('service_id')->filter()->all()
            : [$appointment->service_id];

        $couponResult = app(CouponService::class)->validate($couponCode, [
            'scope' => CouponScope::Booking,
            'tenant_id' => $tenant->id,
            'service_ids' => array_values(array_filter($serviceIds)),
            'amount_cents' => $amountCents,
        ]);

        if ($couponCode && ! $couponResult['valid']) {
            throw new InvalidArgumentException($couponResult['message'] ?? 'Invalid coupon.');
        }

        $discountCents = $couponResult['discount_cents'];
        $finalCents = $couponResult['final_amount_cents'];

        $currency = strtoupper($tenant->currency ?: config('billing.currency', 'GHS'));
        $reference = match ($purposeEnum) {
            PaymentPurpose::Deposit => 'dep_'.Str::uuid(),
            PaymentPurpose::Booking => 'book_'.Str::uuid(),
            default => 'pay_'.Str::uuid(),
        };

        $transaction = PaymentTransaction::query()->create([
            'tenant_id' => $appointment->tenant_id,
            'appointment_id' => $appointment->id,
            'user_id' => $appointment->client_user_id,
            'coupon_id' => $couponResult['coupon']?->id,
            'provider' => $provider,
            'purpose' => $purposeEnum,
            'provider_reference' => $reference,
            'subtotal_cents' => $amountCents,
            'discount_cents' => $discountCents,
            'amount_cents' => $finalCents,
            'currency' => $currency,
            'status' => 'pending',
            'metadata' => [
                'appointment_uuid' => $appointment->uuid,
                'total_cents' => $totalCents,
                'coupon_code' => $couponResult['coupon']?->code,
            ],
        ]);

        $appointment->update([
            'amount_due_cents' => $totalCents,
            'payment_status' => 'pending',
            'payment_reference' => $reference,
        ]);

        $callback = $this->bookingCallbackUrl($tenant, $appointment);

        $gateway = $this->gateways->resolve($provider);
        $init = $gateway->initializePayment([
            'email' => $email,
            'name' => $name ?? $email,
            'amount_cents' => $finalCents,
            'currency' => $currency,
            'reference' => $reference,
            'callback_url' => $callback,
            'metadata' => [
                'transaction_uuid' => $transaction->uuid,
                'appointment_uuid' => $appointment->uuid,
                'purpose' => $purposeEnum->value,
                'tenant_slug' => $tenant->slug,
            ],
        ]);

        return [
            'authorization_url' => $init['authorization_url'],
            'reference' => $init['reference'] ?? $reference,
            'provider' => $provider,
            'demo_mode' => $init['demo_mode'] ?? false,
            'discount_cents' => $discountCents,
            'final_amount_cents' => $finalCents,
            'currency' => $currency,
            'transaction_uuid' => $transaction->uuid,
        ];
    }

    public function completeTransaction(PaymentTransaction $transaction, array $raw = []): PaymentTransaction
    {
        return DB::transaction(function () use ($transaction, $raw) {
            $transaction->refresh();

            if ($transaction->isPaid()) {
                return $transaction;
            }

            $transaction->update([
                'status' => 'paid',
                'paid_at' => now(),
                'payload' => array_merge($transaction->payload ?? [], ['verified' => $raw]),
            ]);

            if ($transaction->appointment_id) {
                $this->applyAppointmentPayment($transaction);
            }

            if ($transaction->coupon_id) {
                app(CouponService::class)->recordRedemption(
                    Coupon::query()->find($transaction->coupon_id)
                );
            }

            if ($transaction->appointment_id) {
                $appointment = Appointment::query()
                    ->withoutGlobalScope('tenant')
                    ->with(['service', 'client', 'tenant'])
                    ->find($transaction->appointment_id);

                if ($appointment) {
                    app(NotificationService::class)->paymentAlert(
                        $appointment,
                        $transaction->amount_cents,
                        $transaction->currency
                    );
                }
            }

            return $transaction->fresh();
        });
    }

    public function markTransactionFailed(
        PaymentTransaction $transaction,
        string $reason,
        array $payload = [],
    ): void {
        $transaction->update([
            'status' => 'failed',
            'failure_reason' => $reason,
            'payload' => array_merge($transaction->payload ?? [], ['failure' => $payload]),
        ]);

        if ($transaction->appointment_id) {
            Appointment::query()
                ->whereKey($transaction->appointment_id)
                ->update(['payment_status' => 'failed']);
        }

        $this->logFailure(
            provider: $transaction->provider,
            reference: $transaction->provider_reference,
            purpose: $transaction->purpose->value,
            amountCents: $transaction->amount_cents,
            currency: $transaction->currency,
            reason: $reason,
            payload: $payload,
            tenantId: $transaction->tenant_id,
            userId: $transaction->user_id,
        );
    }

    public function logFailure(
        string $provider,
        ?string $reference,
        string $purpose,
        int $amountCents,
        string $currency,
        string $reason,
        array $payload = [],
        ?int $tenantId = null,
        ?int $userId = null,
    ): PaymentFailureLog {
        return PaymentFailureLog::query()->create([
            'tenant_id' => $tenantId,
            'user_id' => $userId,
            'provider' => $provider,
            'provider_reference' => $reference,
            'purpose' => $purpose,
            'amount_cents' => $amountCents,
            'currency' => $currency,
            'failure_reason' => $reason,
            'payload' => $payload,
        ]);
    }

    public function logSubscriptionFailure(PlatformSubscription $subscription, string $reason, array $payload = []): void
    {
        $this->logFailure(
            provider: $subscription->provider ?? 'paystack',
            reference: $subscription->provider_reference,
            purpose: PaymentPurpose::Subscription->value,
            amountCents: $subscription->final_amount_cents,
            currency: $subscription->currency,
            reason: $reason,
            payload: $payload,
            userId: $subscription->user_id,
        );
    }

    public function appointmentTotalCents(Appointment $appointment): int
    {
        $group = $appointment->bookingGroup;
        if ($group) {
            $group->loadMissing('appointments.service');

            return (int) $group->appointments->sum(
                fn (Appointment $row) => (int) ($row->service?->price_cents ?? 0)
            );
        }

        return (int) ($appointment->service?->price_cents ?? 0);
    }

    protected function depositAmountCents(Tenant $tenant, int $totalCents): int
    {
        $percent = max(0, min(100, $tenant->depositPercent()));

        if ($percent === 0) {
            throw new InvalidArgumentException('Deposits are not configured for this salon.');
        }

        return (int) max(1, round($totalCents * ($percent / 100)));
    }

    protected function applyAppointmentPayment(PaymentTransaction $transaction): void
    {
        $appointment = Appointment::query()->find($transaction->appointment_id);

        if (! $appointment) {
            return;
        }

        $paidCents = $transaction->amount_cents;
        $totalCents = (int) ($transaction->metadata['total_cents'] ?? $appointment->amount_due_cents ?: $paidCents);

        if ($transaction->purpose === PaymentPurpose::Deposit) {
            $newDeposit = $appointment->deposit_paid_cents + $paidCents;
            $appointment->update([
                'deposit_paid_cents' => $newDeposit,
                'amount_due_cents' => $totalCents,
                'payment_status' => $newDeposit >= $totalCents ? 'paid' : 'partial',
                'payment_reference' => $transaction->provider_reference,
            ]);

            return;
        }

        $appointment->update([
            'deposit_paid_cents' => $paidCents,
            'amount_due_cents' => $totalCents,
            'payment_status' => 'paid',
            'payment_reference' => $transaction->provider_reference,
        ]);
    }

    protected function bookingCallbackUrl(Tenant $tenant, Appointment $appointment): string
    {
        $base = rtrim(config('billing.frontend_url'), '/');

        return "{$base}/{$tenant->slug}/book/payment/verify?appointment={$appointment->uuid}";
    }
}
