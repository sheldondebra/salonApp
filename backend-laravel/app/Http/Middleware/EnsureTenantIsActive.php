<?php

namespace App\Http\Middleware;

use App\Enums\TenantStatus;
use App\Support\TenantContext;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureTenantIsActive
{
    public function handle(Request $request, Closure $next): Response
    {
        $tenant = TenantContext::get();

        if (! $tenant || $tenant->status !== TenantStatus::Active) {
            return response()->json([
                'message' => 'This business workspace is not available for booking.',
            ], 403);
        }

        return $next($request);
    }
}
