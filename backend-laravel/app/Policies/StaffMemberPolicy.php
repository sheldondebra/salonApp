<?php

namespace App\Policies;

use App\Models\StaffMember;
use App\Models\User;
use App\Policies\Concerns\AuthorizesTenantPermission;

class StaffMemberPolicy
{
    use AuthorizesTenantPermission;

    public function viewAny(User $user): bool
    {
        return $this->can($user, 'staff', 'view');
    }

    public function view(User $user, StaffMember $staffMember): bool
    {
        return $this->can($user, 'staff', 'view');
    }

    public function create(User $user): bool
    {
        return $this->can($user, 'staff', 'create');
    }

    public function update(User $user, StaffMember $staffMember): bool
    {
        return $this->can($user, 'staff', 'update');
    }

    public function delete(User $user, StaffMember $staffMember): bool
    {
        return $this->can($user, 'staff', 'delete');
    }

    public function manageSettings(User $user): bool
    {
        return \App\Support\PermissionChecker::allows($user, 'staff.settings')
            || $this->can($user, 'settings', 'manage');
    }
}
