<?php

namespace App\Policies;

use App\Models\Location;
use App\Models\User;
use App\Support\PermissionChecker;

class LocationPolicy
{
    public function viewAny(User $user): bool
    {
        return PermissionChecker::allowsAny($user, ['services.view', 'settings.manage']);
    }

    public function view(User $user, Location $location): bool
    {
        return $this->viewAny($user);
    }

    public function create(User $user): bool
    {
        return PermissionChecker::allows($user, 'settings.manage');
    }

    public function update(User $user, Location $location): bool
    {
        return PermissionChecker::allows($user, 'settings.manage');
    }

    public function delete(User $user, Location $location): bool
    {
        return PermissionChecker::allows($user, 'settings.manage');
    }
}
