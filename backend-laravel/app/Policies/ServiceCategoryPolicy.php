<?php

namespace App\Policies;

use App\Models\ServiceCategory;
use App\Models\User;
use App\Policies\Concerns\AuthorizesTenantPermission;

class ServiceCategoryPolicy
{
    use AuthorizesTenantPermission;

    public function viewAny(User $user): bool
    {
        return $this->can($user, 'services', 'view');
    }

    public function view(User $user, ServiceCategory $category): bool
    {
        return $this->can($user, 'services', 'view');
    }

    public function create(User $user): bool
    {
        return $this->can($user, 'services', 'create');
    }

    public function update(User $user, ServiceCategory $category): bool
    {
        return $this->can($user, 'services', 'update');
    }

    public function delete(User $user, ServiceCategory $category): bool
    {
        return $this->can($user, 'services', 'delete');
    }
}
