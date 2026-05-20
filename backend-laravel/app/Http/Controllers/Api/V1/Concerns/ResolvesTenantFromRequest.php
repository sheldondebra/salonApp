<?php

namespace App\Http\Controllers\Api\V1\Concerns;

use App\Models\Tenant;
use Illuminate\Http\Request;

trait ResolvesTenantFromRequest
{
    protected function tenant(Request $request, string $tenantSlug): Tenant
    {
        /** @var Tenant $tenant */
        $tenant = $request->attributes->get('tenant');
        abort_unless($tenant && $tenant->slug === $tenantSlug, 404);

        return $tenant;
    }
}
