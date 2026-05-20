<?php

namespace App\Policies;

use App\Models\ProductCategory;
use App\Models\User;
use App\Policies\Concerns\AuthorizesTenantPermission;

class ProductCategoryPolicy
{
    use AuthorizesTenantPermission;

    public function viewAny(User $user): bool
    {
        return $this->can($user, 'inventory', 'view');
    }

    public function create(User $user): bool
    {
        return $this->can($user, 'inventory', 'create');
    }

    public function update(User $user, ProductCategory $productCategory): bool
    {
        return $this->can($user, 'inventory', 'update');
    }

    public function delete(User $user, ProductCategory $productCategory): bool
    {
        return $this->can($user, 'inventory', 'delete');
    }
}
