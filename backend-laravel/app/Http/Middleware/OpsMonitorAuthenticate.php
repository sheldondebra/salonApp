<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class OpsMonitorAuthenticate
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! config('ops-monitor.enabled')) {
            abort(404);
        }

        if ($request->session()->get('ops_monitor_authenticated') === true) {
            return $next($request);
        }

        if ($request->routeIs('ops.login') || $request->routeIs('ops.login.submit')) {
            return $next($request);
        }

        return redirect()->route('ops.login');
    }
}
