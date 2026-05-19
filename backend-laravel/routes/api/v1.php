<?php

use App\Http\Controllers\Api\V1\HealthController;
use App\Http\Middleware\EnsureSuperAdmin;
use App\Http\Middleware\EnsureTenantAccess;
use App\Http\Middleware\ResolveTenant;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Public
|--------------------------------------------------------------------------
*/
Route::get('/health', HealthController::class);

/*
|--------------------------------------------------------------------------
| Auth (foundation stubs — implement in feature phase)
|--------------------------------------------------------------------------
*/
Route::prefix('auth')->group(function () {
    Route::post('/login', fn () => response()->json(['message' => 'Not implemented'], 501));
    Route::post('/register', fn () => response()->json(['message' => 'Not implemented'], 501));
    Route::post('/token', fn () => response()->json(['message' => 'Not implemented'], 501));
});

/*
|--------------------------------------------------------------------------
| Tenant-scoped API
|--------------------------------------------------------------------------
*/
Route::middleware([ResolveTenant::class, EnsureTenantAccess::class])
    ->prefix('{tenantSlug}')
    ->group(function () {
        Route::get('/context', fn () => response()->json([
            'tenant' => \App\Support\TenantContext::get(),
        ]));
    });

/*
|--------------------------------------------------------------------------
| Super Admin
|--------------------------------------------------------------------------
*/
Route::middleware(['auth:sanctum', EnsureSuperAdmin::class])
    ->prefix('admin')
    ->group(function () {
        Route::get('/tenants', fn () => response()->json(['message' => 'Not implemented'], 501));
    });

/*
|--------------------------------------------------------------------------
| Mobile-ready authenticated routes
|--------------------------------------------------------------------------
*/
Route::middleware(['auth:sanctum', ResolveTenant::class])
    ->group(function () {
        Route::get('/me', fn () => response()->json(['message' => 'Not implemented'], 501));
    });

/*
|--------------------------------------------------------------------------
| WordPress / integration API
|--------------------------------------------------------------------------
*/
Route::prefix('integrations/wordpress')
    ->group(function () {
        Route::get('/health', fn () => response()->json(['status' => 'wordpress-bridge-ready']));
    });

/*
|--------------------------------------------------------------------------
| Webhooks (payment providers)
|--------------------------------------------------------------------------
*/
Route::prefix('webhooks')->group(function () {
    Route::post('/paystack', fn () => response()->json(['message' => 'Not implemented'], 501));
    Route::post('/flutterwave', fn () => response()->json(['message' => 'Not implemented'], 501));
});
