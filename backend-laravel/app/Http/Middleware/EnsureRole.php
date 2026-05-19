<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureRole
{
    /**
     * @param  string  $roles  Pipe-separated role names (OR)
     */
    public function handle(Request $request, Closure $next, string $roles): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $allowed = explode('|', $roles);
        $guard = config('permissions.guard', 'sanctum');

        foreach ($allowed as $role) {
            if ($user->hasRole(trim($role), $guard)) {
                return $next($request);
            }
        }

        if ($user->isSuperAdmin()) {
            return $next($request);
        }

        return response()->json([
            'message' => 'Insufficient role for this action.',
            'required_roles' => $allowed,
        ], 403);
    }
}
