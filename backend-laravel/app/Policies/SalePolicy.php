<?php

namespace App\Policies;

use App\Models\Sale;
use App\Models\User;
use App\Policies\Concerns\AuthorizesTenantPermission;

class SalePolicy
{
    use AuthorizesTenantPermission;

    public function viewAny(User $user): bool
    {
        return $this->can($user, 'pos', 'view');
    }

    public function view(User $user, Sale $sale): bool
    {
        return $this->can($user, 'pos', 'view');
    }

    public function create(User $user): bool
    {
        return $this->can($user, 'pos', 'create');
    }
}
