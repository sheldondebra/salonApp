<?php

namespace App\Http\Middleware;

use App\Services\TenantResolver;
use App\Support\TenantContext;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ResolveTenant
{
    public function __construct(
        protected TenantResolver $resolver,
    ) {}

    public function handle(Request $request, Closure $next): Response
    {
        $resolution = $this->resolver->resolve($request);

        if ($resolution) {
            TenantContext::set($resolution->tenant, $resolution);
            setPermissionsTeamId($resolution->tenant->id);
            $request->attributes->set('tenant', $resolution->tenant);
            $request->attributes->set('tenant_resolution', $resolution);
        }

        return $next($request);
    }

    public function terminate(Request $request, Response $response): void
    {
        TenantContext::clear();
    }
}
