<?php

namespace App\Services;

use App\Enums\CouponScope;
use App\Models\Coupon;

class CouponService
{
    /**
     * @param  array{
     *   scope: CouponScope,
     *   tenant_id?: int|null,
     *   plan_id?: string|null,
     *   service_ids?: list<int>,
     *   amount_cents: int,
     * }  $context
     * @return array{
     *   valid: bool,
     *   discount_cents: int,
     *   final_amount_cents: int,
     *   coupon: ?Coupon,
     *   message: ?string,
     * }
     */
    public function validate(?string $code, array $context): array
    {
        if (! $code || trim($code) === '') {
            return $this->emptyResult($context['amount_cents']);
        }

        $coupon = $this->findApplicableCoupon(
            $code,
            $context['scope'],
            $context['tenant_id'] ?? null,
        );

        if (! $coupon) {
            return [
                'valid' => false,
                'discount_cents' => 0,
                'final_amount_cents' => $context['amount_cents'],
                'coupon' => null,
                'message' => 'Invalid coupon code.',
            ];
        }

        if (! $coupon->isValid()) {
            return [
                'valid' => false,
                'discount_cents' => 0,
                'final_amount_cents' => $context['amount_cents'],
                'coupon' => null,
                'message' => 'This coupon is expired, inactive, or has reached its usage limit.',
            ];
        }

        $scope = $coupon->scope instanceof CouponScope
            ? $coupon->scope
            : CouponScope::from($coupon->scope ?? 'subscription');

        if ($context['scope'] === CouponScope::Subscription && ! $scope->allowsSubscription()) {
            return $this->invalidScope($context['amount_cents']);
        }

        if ($context['scope'] === CouponScope::Booking && ! $scope->allowsBooking()) {
            return $this->invalidScope($context['amount_cents']);
        }

        if ($coupon->tenant_id !== null && ($context['tenant_id'] ?? null) !== $coupon->tenant_id) {
            return [
                'valid' => false,
                'discount_cents' => 0,
                'final_amount_cents' => $context['amount_cents'],
                'coupon' => null,
                'message' => 'This coupon is not valid for this salon.',
            ];
        }

        if ($context['scope'] === CouponScope::Subscription && $coupon->tenant_id !== null) {
            return [
                'valid' => false,
                'discount_cents' => 0,
                'final_amount_cents' => $context['amount_cents'],
                'coupon' => null,
                'message' => 'This coupon cannot be used for subscriptions.',
            ];
        }

        $planIds = $coupon->metadata['plan_ids'] ?? null;
        if (
            $context['scope'] === CouponScope::Subscription
            && is_array($planIds)
            && $planIds !== []
            && ! empty($context['plan_id'])
            && ! in_array($context['plan_id'], $planIds, true)
        ) {
            return [
                'valid' => false,
                'discount_cents' => 0,
                'final_amount_cents' => $context['amount_cents'],
                'coupon' => null,
                'message' => 'This coupon does not apply to the selected plan.',
            ];
        }

        $serviceIds = $coupon->metadata['service_ids'] ?? null;
        if (
            $context['scope'] === CouponScope::Booking
            && is_array($serviceIds)
            && $serviceIds !== []
        ) {
            $bookingServices = collect($context['service_ids'] ?? []);
            if ($bookingServices->isEmpty() || $bookingServices->intersect($serviceIds)->isEmpty()) {
                return [
                    'valid' => false,
                    'discount_cents' => 0,
                    'final_amount_cents' => $context['amount_cents'],
                    'coupon' => null,
                    'message' => 'This coupon does not apply to the selected services.',
                ];
            }
        }

        $minAmount = (int) ($coupon->metadata['min_amount_cents'] ?? 0);
        if ($minAmount > 0 && $context['amount_cents'] < $minAmount) {
            return [
                'valid' => false,
                'discount_cents' => 0,
                'final_amount_cents' => $context['amount_cents'],
                'coupon' => null,
                'message' => 'Order amount is below the minimum for this coupon.',
            ];
        }

        $discount = $this->calculateDiscount($coupon, $context['amount_cents']);
        $final = max(0, $context['amount_cents'] - $discount);

        return [
            'valid' => true,
            'discount_cents' => $discount,
            'final_amount_cents' => $final,
            'coupon' => $coupon,
            'message' => null,
        ];
    }

    public function findApplicableCoupon(string $code, CouponScope $scope, ?int $tenantId): ?Coupon
    {
        $normalized = strtoupper(trim($code));

        if ($tenantId) {
            $tenantCoupon = Coupon::query()
                ->where('code', $normalized)
                ->where('tenant_id', $tenantId)
                ->first();

            if ($tenantCoupon) {
                return $tenantCoupon;
            }
        }

        return Coupon::query()
            ->where('code', $normalized)
            ->whereNull('tenant_id')
            ->first();
    }

    public function calculateDiscount(Coupon $coupon, int $amountCents): int
    {
        if ($coupon->type === 'percent') {
            return (int) round($amountCents * ($coupon->value / 100));
        }

        return min($amountCents, (int) $coupon->value);
    }

    public function recordRedemption(?Coupon $coupon): void
    {
        if ($coupon) {
            Coupon::query()->whereKey($coupon->id)->increment('redemptions_count');
        }
    }

    public function assertCodeAvailable(string $code, ?int $tenantId, ?int $ignoreId = null): void
    {
        $normalized = strtoupper(trim($code));

        $exists = Coupon::query()
            ->where('code', $normalized)
            ->when(
                $tenantId,
                fn ($q) => $q->where('tenant_id', $tenantId),
                fn ($q) => $q->whereNull('tenant_id'),
            )
            ->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))
            ->exists();

        if ($exists) {
            throw new \InvalidArgumentException('A coupon with this code already exists.');
        }
    }

    /** @return array{valid: bool, discount_cents: int, final_amount_cents: int, coupon: ?Coupon, message: ?string} */
    protected function emptyResult(int $amountCents): array
    {
        return [
            'valid' => true,
            'discount_cents' => 0,
            'final_amount_cents' => $amountCents,
            'coupon' => null,
            'message' => null,
        ];
    }

    /** @return array{valid: bool, discount_cents: int, final_amount_cents: int, coupon: ?Coupon, message: ?string} */
    protected function invalidScope(int $amountCents): array
    {
        return [
            'valid' => false,
            'discount_cents' => 0,
            'final_amount_cents' => $amountCents,
            'coupon' => null,
            'message' => 'This coupon cannot be used for this purchase type.',
        ];
    }
}
