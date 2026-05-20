<?php

namespace App\Policies;

use App\Models\Product;
use App\Models\User;
use App\Policies\Concerns\AuthorizesTenantPermission;

class ProductPolicy
{
    use AuthorizesTenantPermission;

    public function viewAny(User $user): bool
    {
        return $this->can($user, 'inventory', 'view') || $this->can($user, 'pos', 'view');
    }

    public function view(User $user, Product $product): bool
    {
        return $this->viewAny($user);
    }

    public function create(User $user): bool
    {
        return $this->can($user, 'inventory', 'create');
    }

    public function update(User $user, Product $product): bool
    {
        return $this->can($user, 'inventory', 'update');
    }

    public function delete(User $user, Product $product): bool
    {
        return $this->can($user, 'inventory', 'delete');
    }
}
