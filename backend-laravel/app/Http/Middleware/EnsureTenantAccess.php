<?php

namespace App\Http\Middleware;

use App\Support\TenantContext;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureTenantAccess
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! TenantContext::check()) {
            return response()->json([
                'message' => 'Tenant context is required for this resource.',
            ], 404);
        }

        $user = $request->user();

        if ($user && ! $user->isSuperAdmin() && ! $user->isPlatformAdmin()) {
            $tenantId = TenantContext::id();
            $belongs = $user->tenants()->where('tenants.id', $tenantId)->exists();

            if (! $belongs) {
                return response()->json([
                    'message' => 'You do not have access to this tenant workspace.',
                ], 403);
            }
        }

        return $next($request);
    }
}
