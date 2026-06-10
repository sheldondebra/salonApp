<?php

namespace App\Policies;

use App\Models\User;
use App\Policies\Concerns\AuthorizesTenantPermission;
use App\Support\PermissionChecker;

class FinancePolicy
{
    use AuthorizesTenantPermission;

    public function viewFinance(User $user): bool
    {
        return $this->can($user, 'finance', 'view');
    }

    public function refundFinance(User $user): bool
    {
        return PermissionChecker::allows($user, 'finance.refund');
    }

    public function adjustFinance(User $user): bool
    {
        return PermissionChecker::allows($user, 'finance.adjust_transaction');
    }

    public function viewFinancePayroll(User $user): bool
    {
        return $this->can($user, 'finance', 'view')
            || PermissionChecker::allows($user, 'finance.payroll.view');
    }

    public function viewOwnFinancePayroll(User $user): bool
    {
        return PermissionChecker::allows($user, 'finance.payroll.view_self');
    }
}
