<?php

namespace App\Support;

class PermissionList
{
    public static function all(): array
    {
        $names = [];

        foreach (config('permissions.resources', []) as $resource) {
            foreach (config('permissions.actions', []) as $action) {
                $names[] = self::name($resource, $action);
            }
        }

        return array_merge($names, config('permissions.standalone', []));
    }

    public static function name(string $resource, string $action): string
    {
        if (in_array($resource, ['billing', 'settings'], true) && $action === 'manage') {
            return "{$resource}.manage";
        }

        return "{$resource}.{$action}";
    }

    /**
     * Expand role matrix from config into permission name list.
     *
     * @param  array<string, array<string, list<string>|string>>  $roleConfig
     * @return list<string>
     */
    public static function forRole(array $roleConfig): array
    {
        if (array_key_exists('*', $roleConfig)) {
            return self::all();
        }

        $permissions = [];

        foreach ($roleConfig as $resource => $actions) {
            if ($resource === '*' || ! is_array($actions)) {
                continue;
            }

            foreach ($actions as $action) {
                $permissions[] = self::name($resource, $action);
            }
        }

        return array_values(array_unique($permissions));
    }

    /** @return array<string, list<string>> */
    public static function roleMatrix(): array
    {
        $matrix = [];
        foreach (config('permissions.roles', []) as $role => $config) {
            $matrix[$role] = self::forRole(is_array($config) ? $config : []);
        }

        return $matrix;
    }
}
