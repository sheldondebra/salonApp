<?php

namespace App\Policies;

use App\Models\Appointment;
use App\Models\User;
use App\Policies\Concerns\AuthorizesTenantPermission;

class AppointmentPolicy
{
    use AuthorizesTenantPermission;

    public function viewAny(User $user): bool
    {
        return $this->can($user, 'bookings', 'view');
    }

    public function view(User $user, Appointment $appointment): bool
    {
        return $this->can($user, 'bookings', 'view');
    }

    public function create(User $user): bool
    {
        return $this->can($user, 'bookings', 'create');
    }

    public function update(User $user, Appointment $appointment): bool
    {
        return $this->can($user, 'bookings', 'update');
    }

    public function delete(User $user, Appointment $appointment): bool
    {
        return $this->can($user, 'bookings', 'delete');
    }

    public function export(User $user): bool
    {
        return $this->can($user, 'bookings', 'export');
    }
}
