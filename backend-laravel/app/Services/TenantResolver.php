<?php

namespace App\Services;

use App\Enums\TenantDomainType;
use App\Enums\TenantResolutionSource;
use App\Enums\TenantStatus;
use App\Models\Tenant;
use App\Models\TenantDomain;
use App\Support\TenantResolution;
use Illuminate\Http\Request;

class TenantResolver
{
    public function resolve(Request $request): ?TenantResolution
    {
        if ($headerId = $request->header(config('tenant.header'))) {
            $tenant = Tenant::query()->whereKey($headerId)->first();

            if ($tenant) {
                return new TenantResolution($tenant, TenantResolutionSource::Header);
            }
        }

        $host = strtolower($request->getHost());

        if ($custom = $this->resolveByCustomDomain($host)) {
            return $custom;
        }

        if ($this->isWorkplaceHost($host)) {
            $slug = $this->slugFromWorkplacePath($request);

            if ($slug && ($tenant = $this->findActiveTenantBySlug($slug))) {
                return new TenantResolution($tenant, TenantResolutionSource::WorkplaceSlug);
            }

            return null;
        }

        $slug = $request->route('tenantSlug');

        if ($slug && ($tenant = $this->findActiveTenantBySlug($slug))) {
            return new TenantResolution($tenant, TenantResolutionSource::RouteSlug);
        }

        return null;
    }

    protected function resolveByCustomDomain(string $host): ?TenantResolution
    {
        if ($this->isPlatformHost($host)) {
            return null;
        }

        $query = TenantDomain::query()
            ->with('tenant')
            ->where('domain', $host)
            ->where('type', TenantDomainType::Custom->value);

        if (! config('tenant.allow_unverified_domains')) {
            $query->whereNotNull('verified_at');
        }

        $domain = $query->first();

        if (! $domain?->tenant || $domain->tenant->status !== TenantStatus::Active) {
            return null;
        }

        return new TenantResolution($domain->tenant, TenantResolutionSource::CustomDomain);
    }

    protected function findActiveTenantBySlug(string $slug): ?Tenant
    {
        return Tenant::query()
            ->where('slug', $slug)
            ->where('status', TenantStatus::Active)
            ->first();
    }

    protected function slugFromWorkplacePath(Request $request): ?string
    {
        $segment = $request->segment(config('tenant.workplace_slug_segment', 1));

        if (! $segment || in_array($segment, config('tenant.reserved_slugs', []), true)) {
            return null;
        }

        return $segment;
    }

    protected function isWorkplaceHost(string $host): bool
    {
        $workplace = strtolower(config('tenant.workplace_host'));

        return $host === $workplace || str_ends_with($host, '.'.$workplace);
    }

    protected function isPlatformHost(string $host): bool
    {
        $root = strtolower(config('tenant.root_domain'));
        $workplace = strtolower(config('tenant.workplace_host'));

        if (in_array($host, ['localhost', '127.0.0.1', $root, 'www.'.$root], true)) {
            return true;
        }

        return $host === $workplace || str_ends_with($host, '.'.$workplace);
    }
}
