<?php

namespace App\Policies;

use App\Models\User;
use App\Policies\Concerns\AuthorizesTenantPermission;

class ClientPolicy
{
    use AuthorizesTenantPermission;

    public function viewAny(User $user): bool
    {
        return $this->can($user, 'clients', 'view');
    }

    public function view(User $user, User $client): bool
    {
        return $this->can($user, 'clients', 'view');
    }

    public function create(User $user): bool
    {
        return $this->can($user, 'clients', 'create');
    }

    public function update(User $user, User $client): bool
    {
        return $this->can($user, 'clients', 'update');
    }

    public function delete(User $user, User $client): bool
    {
        return $this->can($user, 'clients', 'delete');
    }
}
