<?php

namespace App\Policies;

use App\Models\Supplier;
use App\Models\User;
use App\Policies\Concerns\AuthorizesTenantPermission;

class SupplierPolicy
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

    public function update(User $user, Supplier $supplier): bool
    {
        return $this->can($user, 'inventory', 'update');
    }

    public function delete(User $user, Supplier $supplier): bool
    {
        return $this->can($user, 'inventory', 'delete');
    }
}
