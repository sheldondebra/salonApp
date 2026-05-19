<?php

use App\Http\Middleware\EnsurePermission;
use App\Http\Middleware\EnsureRole;
use App\Http\Middleware\EnsureTenantAccess;
use App\Http\Middleware\EnsureTenantIsActive;
use App\Http\Middleware\EnsureTenantResolved;
use App\Http\Middleware\ResolveTenant;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
        apiPrefix: 'api',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->alias([
            'tenant.resolve' => ResolveTenant::class,
            'tenant.resolved' => EnsureTenantResolved::class,
            'tenant.active' => EnsureTenantIsActive::class,
            'tenant.access' => EnsureTenantAccess::class,
            'permission' => EnsurePermission::class,
            'role' => EnsureRole::class,
        ]);

        $middleware->validateCsrfTokens(except: [
            'api/*',
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();
