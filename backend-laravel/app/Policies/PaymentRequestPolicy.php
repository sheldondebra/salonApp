<?php

namespace App\Policies;

use App\Models\PaymentRequest;
use App\Models\User;
use App\Support\PermissionChecker;

class PaymentRequestPolicy
{
    public function viewAny(User $user): bool
    {
        return PermissionChecker::allows($user, 'payment_requests.view');
    }

    public function view(User $user, PaymentRequest $paymentRequest): bool
    {
        return PermissionChecker::allows($user, 'payment_requests.view');
    }

    public function create(User $user): bool
    {
        return PermissionChecker::allows($user, 'payment_requests.create');
    }

    public function cancel(User $user, PaymentRequest $paymentRequest): bool
    {
        return PermissionChecker::allows($user, 'payment_requests.cancel');
    }

    public function retry(User $user, PaymentRequest $paymentRequest): bool
    {
        return PermissionChecker::allows($user, 'payment_requests.retry');
    }

    public function verify(User $user, PaymentRequest $paymentRequest): bool
    {
        return PermissionChecker::allows($user, 'payment_requests.verify');
    }
}
