<?php

namespace App\Services;

use App\Enums\ApprovalRequestStatus;
use App\Models\ApprovalRequest;
use App\Models\Tenant;
use App\Models\User;
use App\Support\PermissionChecker;
use Illuminate\Validation\ValidationException;

class PosDiscountPolicyService
{
    public function thresholdPercent(Tenant $tenant): int
    {
        $value = (int) $tenant->setting('finance.discount_approval_threshold_percent', 20);

        return max(0, min(100, $value));
    }

    /**
     * @return array{threshold_percent: int, discount_cents: int, discount_percent: float, requires_approval: bool}
     */
    public function analyze(Tenant $tenant, int $subtotalCents, int $couponDiscountCents, int $manualDiscountCents): array
    {
        $discountCents = max(0, $couponDiscountCents + $manualDiscountCents);
        $discountPercent = $subtotalCents > 0
            ? round(($discountCents / $subtotalCents) * 100, 2)
            : 0.0;
        $threshold = $this->thresholdPercent($tenant);

        return [
            'threshold_percent' => $threshold,
            'discount_cents' => $discountCents,
            'discount_percent' => $discountPercent,
            'requires_approval' => $subtotalCents > 0 && $discountPercent >= $threshold && $discountCents > 0,
        ];
    }

    /**
     * @throws ValidationException
     */
    public function assertAllowed(
        Tenant $tenant,
        User $user,
        int $subtotalCents,
        int $couponDiscountCents,
        int $manualDiscountCents,
        ?string $approvalRequestUuid = null,
    ): void {
        if ($manualDiscountCents > 0 && ! PermissionChecker::allows($user, 'finance.apply_discount')) {
            throw ValidationException::withMessages([
                'manual_discount_cents' => ['You do not have permission to apply manual discounts.'],
            ]);
        }

        if ($manualDiscountCents > $subtotalCents) {
            throw ValidationException::withMessages([
                'manual_discount_cents' => ['Manual discount cannot exceed the subtotal.'],
            ]);
        }

        $analysis = $this->analyze($tenant, $subtotalCents, $couponDiscountCents, $manualDiscountCents);

        if (! $analysis['requires_approval']) {
            return;
        }

        if (PermissionChecker::allows($user, 'finance.approve_discount')) {
            return;
        }

        if ($approvalRequestUuid) {
            $this->assertApprovedRequest($tenant->id, $approvalRequestUuid, $analysis);

            return;
        }

        throw ValidationException::withMessages([
            'discount' => [
                "Discount of {$analysis['discount_percent']}% needs manager approval (limit {$analysis['threshold_percent']}%). Request approval before checkout.",
            ],
            'requires_approval' => ['true'],
            'discount_percent' => [(string) $analysis['discount_percent']],
            'threshold_percent' => [(string) $analysis['threshold_percent']],
        ]);
    }

    /**
     * @param  array{discount_cents: int, discount_percent: float}  $analysis
     *
     * @throws ValidationException
     */
    private function assertApprovedRequest(int $tenantId, string $uuid, array $analysis): void
    {
        $approval = ApprovalRequest::query()
            ->where('tenant_id', $tenantId)
            ->where('uuid', $uuid)
            ->where('type', 'pos_discount')
            ->first();

        if (! $approval || $approval->status !== ApprovalRequestStatus::Approved) {
            throw ValidationException::withMessages([
                'approval_request_uuid' => ['Manager approval is required for this discount.'],
            ]);
        }

        $payloadDiscount = (int) ($approval->payload['discount_cents'] ?? 0);
        if (abs($payloadDiscount - $analysis['discount_cents']) > 1) {
            throw ValidationException::withMessages([
                'approval_request_uuid' => ['Approved discount no longer matches this cart. Request approval again.'],
            ]);
        }
    }
}
