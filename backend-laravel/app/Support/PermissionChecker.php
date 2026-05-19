<?php

namespace App\Support;

use App\Models\User;
use Illuminate\Support\Facades\Gate;

class PermissionChecker
{
    public static function allows(?User $user, string $permission): bool
    {
        if (! $user) {
            return false;
        }

        if ($user->isSuperAdmin()) {
            return true;
        }

        return $user->hasPermissionTo($permission, config('permissions.guard', 'sanctum'));
    }

    public static function allowsAny(?User $user, array $permissions): bool
    {
        foreach ($permissions as $permission) {
            if (self::allows($user, $permission)) {
                return true;
            }
        }

        return false;
    }

    public static function allowsAll(?User $user, array $permissions): bool
    {
        foreach ($permissions as $permission) {
            if (! self::allows($user, $permission)) {
                return false;
            }
        }

        return true;
    }

    public static function registerGateBefore(): void
    {
        Gate::before(function (?User $user, string $ability) {
            if ($user?->isSuperAdmin()) {
                return true;
            }

            return null;
        });
    }
}
