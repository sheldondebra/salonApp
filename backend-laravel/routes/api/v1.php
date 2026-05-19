<?php

use App\Http\Controllers\Api\V1\Admin\BillingAdminController;
use App\Http\Controllers\Api\V1\Admin\TenantController as AdminTenantController;
use App\Http\Controllers\Api\V1\BillingController;
use App\Http\Controllers\Api\V1\OnboardingController;
use App\Http\Controllers\Api\V1\PaymentWebhookController;
use App\Http\Controllers\Api\V1\AppointmentController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\ClientAccountController;
use App\Http\Controllers\Api\V1\SocialAuthController;
use App\Http\Controllers\Api\V1\BookingCatalogController;
use App\Http\Controllers\Api\V1\DashboardController;
use App\Http\Controllers\Api\V1\HealthController;
use App\Http\Controllers\Api\V1\PlatformAbilitiesController;
use App\Http\Controllers\Api\V1\TenantAbilitiesController;
use App\Http\Controllers\Api\V1\TenantContextController;
use App\Http\Middleware\EnsurePermission;
use App\Http\Middleware\EnsureTenantAccess;
use App\Http\Middleware\EnsureTenantIsActive;
use App\Http\Middleware\EnsureTenantResolved;
use App\Http\Middleware\ResolveTenant;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Public (no tenant)
|--------------------------------------------------------------------------
*/
Route::get('/health', HealthController::class);

Route::get('/billing/plans', [BillingController::class, 'plans']);

/*
|--------------------------------------------------------------------------
| Auth (tenant-agnostic)
|--------------------------------------------------------------------------
*/
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::get('/social/{provider}/redirect', [SocialAuthController::class, 'redirect']);
    Route::get('/social/{provider}/callback', [SocialAuthController::class, 'callback']);
});

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::get('/auth/platform/abilities', PlatformAbilitiesController::class);
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    Route::prefix('billing')->group(function () {
        Route::post('/coupons/validate', [BillingController::class, 'validateCoupon']);
        Route::post('/checkout', [BillingController::class, 'checkout']);
        Route::get('/verify', [BillingController::class, 'verify']);
        Route::get('/status', [BillingController::class, 'status']);
    });

    Route::post('/onboarding/tenant', [OnboardingController::class, 'store']);
});

/*
|--------------------------------------------------------------------------
| Public booking — custom domain
|--------------------------------------------------------------------------
*/
Route::middleware([ResolveTenant::class, EnsureTenantResolved::class, EnsureTenantIsActive::class])
    ->prefix('booking')
    ->group(function () {
        Route::get('/context', TenantContextController::class);
        Route::get('/services', [BookingCatalogController::class, 'services']);
        Route::get('/staff', [BookingCatalogController::class, 'staff']);
        Route::post('/appointments', [AppointmentController::class, 'store']);
    });

/*
|--------------------------------------------------------------------------
| Public booking — workplace slug
|--------------------------------------------------------------------------
*/
Route::middleware([ResolveTenant::class, EnsureTenantResolved::class, EnsureTenantIsActive::class])
    ->prefix('{tenantSlug}')
    ->group(function () {
        Route::get('/context', TenantContextController::class);
        Route::get('/services', [BookingCatalogController::class, 'services']);
        Route::get('/staff', [BookingCatalogController::class, 'staff']);
        Route::post('/appointments', [AppointmentController::class, 'store']);
    });

/*
|--------------------------------------------------------------------------
| Authenticated tenant workspace
|--------------------------------------------------------------------------
*/
Route::middleware(['auth:sanctum', ResolveTenant::class, EnsureTenantResolved::class, EnsureTenantAccess::class])
    ->prefix('{tenantSlug}')
    ->group(function () {
        Route::get('/auth/abilities', TenantAbilitiesController::class);

        Route::middleware(EnsurePermission::class.':analytics.view')->group(function () {
            Route::get('/dashboard/stats', [DashboardController::class, 'stats']);
            Route::get('/dashboard/revenue-chart', [DashboardController::class, 'revenueChart']);
            Route::get('/dashboard/upcoming', [DashboardController::class, 'upcomingAppointments']);
        });

        Route::middleware(EnsurePermission::class.':bookings.view')->group(function () {
            Route::get('/appointments', [AppointmentController::class, 'index']);
        });

        Route::prefix('account')->group(function () {
            Route::get('/bookings', [ClientAccountController::class, 'bookingHistory']);
            Route::get('/favorites', [ClientAccountController::class, 'favorites']);
            Route::post('/favorites', [ClientAccountController::class, 'storeFavorite']);
            Route::delete('/favorites/{type}/{id}', [ClientAccountController::class, 'destroyFavorite']);
            Route::get('/loyalty', [ClientAccountController::class, 'loyalty']);
            Route::patch('/profile', [ClientAccountController::class, 'updateProfile']);
        });
    });

/*
|--------------------------------------------------------------------------
| Platform admin
|--------------------------------------------------------------------------
*/
Route::middleware(['auth:sanctum', EnsurePermission::class.':tenants.view'])
    ->prefix('admin')
    ->group(function () {
        Route::get('/tenants', [AdminTenantController::class, 'index']);
        Route::get('/payments', [BillingAdminController::class, 'payments']);
        Route::get('/signups/unpaid', [BillingAdminController::class, 'unpaidSignups']);
    });

/*
|--------------------------------------------------------------------------
| Integrations & webhooks
|--------------------------------------------------------------------------
*/
Route::prefix('integrations/wordpress')->group(function () {
    Route::get('/health', fn () => response()->json(['status' => 'wordpress-bridge-ready']));
});

Route::prefix('webhooks')->group(function () {
    Route::post('/paystack', [PaymentWebhookController::class, 'paystack']);
    Route::post('/flutterwave', [PaymentWebhookController::class, 'flutterwave']);
});
