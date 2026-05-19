<?php

namespace App\Http\Middleware;

use App\Support\PermissionChecker;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsurePermission
{
    /**
     * @param  string  $permissions  Pipe-separated (OR), e.g. "bookings.view|bookings.create"
     */
    public function handle(Request $request, Closure $next, string $permissions): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $required = explode('|', $permissions);

        if (! PermissionChecker::allowsAny($user, $required)) {
            return response()->json([
                'message' => 'You do not have permission to perform this action.',
                'required' => $required,
            ], 403);
        }

        return $next($request);
    }
}
