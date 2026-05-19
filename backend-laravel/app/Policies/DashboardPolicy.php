<?php

namespace App\Policies;

use App\Models\User;
use App\Policies\Concerns\AuthorizesTenantPermission;

class DashboardPolicy
{
    use AuthorizesTenantPermission;

    public function viewAnalytics(User $user): bool
    {
        return $this->can($user, 'analytics', 'view');
    }
}
