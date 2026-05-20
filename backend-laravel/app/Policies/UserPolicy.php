<?php

namespace App\Policies;

use App\Enums\UserType;
use App\Models\User;

class UserPolicy
{
    public function viewAny(User $actor): bool
    {
        return $actor->canPermission('tenants.view');
    }

    public function view(User $actor, User $target): bool
    {
        return $this->viewAny($actor) && $target->user_type !== UserType::Client;
    }

    public function update(User $actor, User $target): bool
    {
        return $this->view($actor, $target);
    }

    public function delete(User $actor, User $target): bool
    {
        return $this->view($actor, $target);
    }
}
