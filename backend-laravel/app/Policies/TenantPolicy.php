<?php

namespace App\Policies;

use App\Models\Tenant;
use App\Models\User;
use App\Policies\Concerns\AuthorizesTenantPermission;

class TenantPolicy
{
    use AuthorizesTenantPermission;

    public function viewAny(User $user): bool
    {
        return $this->can($user, 'tenants', 'view');
    }

    public function view(User $user, Tenant $tenant): bool
    {
        return $this->can($user, 'tenants', 'view');
    }

    public function create(User $user): bool
    {
        return $this->can($user, 'tenants', 'create');
    }

    public function update(User $user, Tenant $tenant): bool
    {
        return $this->can($user, 'tenants', 'update');
    }

    public function delete(User $user, Tenant $tenant): bool
    {
        return $this->can($user, 'tenants', 'delete');
    }
}
