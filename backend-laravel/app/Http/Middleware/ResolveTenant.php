<?php

namespace App\Http\Middleware;

use App\Models\Tenant;
use App\Models\TenantDomain;
use App\Support\TenantContext;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ResolveTenant
{
    public function handle(Request $request, Closure $next): Response
    {
        $tenant = $this->resolveFromRequest($request);

        if ($tenant) {
            TenantContext::set($tenant);
            setPermissionsTeamId($tenant->id);
        }

        return $next($request);
    }

    public function terminate(Request $request, Response $response): void
    {
        TenantContext::clear();
    }

    protected function resolveFromRequest(Request $request): ?Tenant
    {
        if ($headerId = $request->header(config('tenant.header'))) {
            return Tenant::query()->whereKey($headerId)->first();
        }

        $host = strtolower($request->getHost());

        if ($domain = TenantDomain::query()->where('domain', $host)->first()) {
            return $domain->tenant;
        }

        if ($this->isWorkplaceHost($host)) {
            $slug = $request->route('tenantSlug') ?? $this->slugFromPath($request);

            if ($slug) {
                return Tenant::query()->where('slug', $slug)->first();
            }
        }

        return null;
    }

    protected function isWorkplaceHost(string $host): bool
    {
        $workplace = strtolower(config('tenant.workplace_host'));

        return $host === $workplace || str_ends_with($host, '.'.$workplace);
    }

    protected function slugFromPath(Request $request): ?string
    {
        $segment = $request->segment(config('tenant.slug_segment_index') + 1);

        return $segment ?: null;
    }
}
