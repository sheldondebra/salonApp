<?php

namespace App\Policies;

use App\Models\Service;
use App\Models\User;
use App\Policies\Concerns\AuthorizesTenantPermission;

class ServicePolicy
{
    use AuthorizesTenantPermission;

    public function viewAny(User $user): bool
    {
        return $this->can($user, 'services', 'view') || $this->can($user, 'pos', 'view');
    }

    public function view(User $user, Service $service): bool
    {
        return $this->viewAny($user);
    }

    public function create(User $user): bool
    {
        return $this->can($user, 'services', 'create');
    }

    public function update(User $user, Service $service): bool
    {
        return $this->can($user, 'services', 'update');
    }

    public function delete(User $user, Service $service): bool
    {
        return $this->can($user, 'services', 'delete');
    }
}
