<?php

use App\Http\Controllers\Ops\OpsAuthController;
use App\Http\Controllers\Ops\OpsDatabaseController;
use App\Http\Controllers\Ops\OpsDashboardController;
use App\Http\Controllers\Ops\OpsDocumentationController;
use App\Http\Middleware\OpsMonitorAuthenticate;
use Illuminate\Support\Facades\Route;

$path = trim((string) config('ops-monitor.path', 'ops'), '/');

Route::prefix($path)->name('ops.')->group(function () {
    Route::get('/login', [OpsAuthController::class, 'showLogin'])->name('login');
    Route::post('/login', [OpsAuthController::class, 'login'])->name('login.submit');

    Route::middleware([OpsMonitorAuthenticate::class])->group(function () {
        Route::get('/', [OpsDashboardController::class, 'index'])->name('dashboard');
        Route::get('/docs', [OpsDocumentationController::class, 'index'])->name('docs');
        Route::get('/docs/export', [OpsDocumentationController::class, 'export'])->name('docs.export');
        Route::get('/routes', [OpsDashboardController::class, 'routes'])->name('routes');
        Route::get('/routes/{routeName}', [OpsDashboardController::class, 'routeDetail'])
            ->where('routeName', '.*')
            ->name('routes.show');
        Route::get('/requests', [OpsDashboardController::class, 'requests'])->name('requests');
        Route::get('/errors', [OpsDashboardController::class, 'errors'])->name('errors');
        Route::get('/errors/check', [OpsDashboardController::class, 'errorsCheck'])->name('errors.check');
        Route::get('/system', [OpsDashboardController::class, 'system'])->name('system');
        Route::get('/database', [OpsDatabaseController::class, 'index'])->name('database');
        Route::get('/database/tables/{table}', [OpsDatabaseController::class, 'show'])
            ->where('table', '[A-Za-z0-9_]+')
            ->name('database.table');
        Route::get('/database/tables/{table}/export', [OpsDatabaseController::class, 'export'])
            ->where('table', '[A-Za-z0-9_]+')
            ->name('database.export');
        Route::get('/logs', [OpsDashboardController::class, 'logs'])->name('logs');
        Route::post('/logout', [OpsAuthController::class, 'logout'])->name('logout');
    });
});
