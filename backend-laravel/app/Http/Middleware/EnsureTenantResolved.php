<?php

namespace App\Http\Middleware;

use App\Support\TenantContext;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureTenantResolved
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! TenantContext::check()) {
            return response()->json([
                'message' => 'Tenant could not be resolved for this request.',
            ], 404);
        }

        return $next($request);
    }
}
