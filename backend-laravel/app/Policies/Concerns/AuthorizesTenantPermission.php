<?php

namespace App\Policies\Concerns;

use App\Models\User;
use App\Support\PermissionChecker;
use App\Support\PermissionList;

trait AuthorizesTenantPermission
{
    protected function can(User $user, string $resource, string $action): bool
    {
        return PermissionChecker::allows($user, PermissionList::name($resource, $action));
    }
}
