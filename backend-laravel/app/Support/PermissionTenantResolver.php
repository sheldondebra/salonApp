<?php

namespace App\Support;

use Spatie\Permission\Contracts\PermissionsTeamResolver;

class PermissionTenantResolver implements PermissionsTeamResolver
{
    protected int|string|null $teamId = null;

    public function getPermissionsTeamId(): int|string|null
    {
        if ($this->teamId !== null) {
            return $this->teamId;
        }

        return TenantContext::id() ?? config('tenant.platform_team_id', 0);
    }

    public function setPermissionsTeamId($id): void
    {
        $this->teamId = $id;
    }
}
