<?php

use App\Http\Middleware\EnsurePermission;
use App\Http\Middleware\EnsureRole;
use App\Http\Middleware\EnsureTenantAccess;
use App\Http\Middleware\EnsureTenantIsActive;
use App\Http\Middleware\EnsureTenantResolved;
use App\Http\Middleware\ResolveTenant;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\Log;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

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
    ->withSchedule(function (Schedule $schedule) {
        $schedule->command('bookings:send-reminders')->hourly();
    })
    ->withExceptions(function (Exceptions $exceptions) {
        $exceptions->shouldRenderJsonWhen(fn (Request $request) => $request->is('api/*'));

        $exceptions->render(function (ValidationException $e, Request $request) {
            if (! $request->is('api/*')) {
                return null;
            }

            return response()->json([
                'message' => 'The given data was invalid.',
                'errors' => $e->errors(),
            ], 422);
        });

        $exceptions->render(function (AuthenticationException $e, Request $request) {
            if (! $request->is('api/*')) {
                return null;
            }

            return response()->json([
                'message' => 'Unauthenticated.',
            ], 401);
        });

        $exceptions->render(function (HttpExceptionInterface $e, Request $request) {
            if (! $request->is('api/*')) {
                return null;
            }

            $status = $e->getStatusCode();
            $message = $e->getMessage() ?: match ($status) {
                403 => 'Forbidden.',
                404 => 'Not found.',
                429 => 'Too many requests.',
                default => 'Request failed.',
            };

            return response()->json(['message' => $message], $status);
        });

        $exceptions->render(function (QueryException $e, Request $request) {
            if (! $request->is('api/*')) {
                return null;
            }

            Log::warning('database.query_failed', ['message' => $e->getMessage()]);

            $message = 'A database error occurred. Please try again.';
            if (str_contains($e->getMessage(), 'cached plan must not change result type')) {
                $message = 'Database schema was updated. Restart the API server and try again.';
            }

            return response()->json(['message' => $message], 500);
        });
    })->create();
