<?php

namespace App\Policies;

use App\Models\User;
use App\Support\PermissionChecker;

class CashDrawerSessionPolicy
{
    public function create(User $user): bool
    {
        return PermissionChecker::allows($user, 'pos.create')
            || PermissionChecker::allows($user, 'finance.reconciliation.manage');
    }
}
