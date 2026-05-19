<?php

namespace App\Support;

use Spatie\Permission\Contracts\PermissionsTeamResolver;

class PermissionTenantResolver implements PermissionsTeamResolver
{
    protected int|string|null $teamId = null;

    public function getPermissionsTeamId(): int|string|null
    {
        return $this->teamId ?? TenantContext::id();
    }

    public function setPermissionsTeamId($id): void
    {
        $this->teamId = $id;
    }
}
