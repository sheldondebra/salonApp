<?php

namespace App\Policies;

use App\Models\TenantPaymentSetting;
use App\Models\User;
use App\Support\PermissionChecker;

class TenantPaymentSettingPolicy
{
    public function view(User $user): bool
    {
        return PermissionChecker::allows($user, 'settings.manage');
    }

    public function update(User $user): bool
    {
        return PermissionChecker::allows($user, 'settings.manage');
    }
}
