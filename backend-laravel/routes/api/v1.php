<?php

use App\Http\Controllers\Api\V1\Admin\AdminAppointmentController;
use App\Http\Controllers\Api\V1\Admin\AdminDashboardController;
use App\Http\Controllers\Api\V1\Admin\AdminReportsController;
use App\Http\Controllers\Api\V1\Admin\AdminOnboardingController;
use App\Http\Controllers\Api\V1\Admin\BillingAdminController;
use App\Http\Controllers\Api\V1\Admin\CouponAdminController;
use App\Http\Controllers\Api\V1\Admin\DomainAdminController;
use App\Http\Controllers\Api\V1\Admin\PlanAdminController;
use App\Http\Controllers\Api\V1\Admin\SmsAdminController;
use App\Http\Controllers\Api\V1\Admin\SmsPackageAdminController;
use App\Http\Controllers\Api\V1\Admin\SmsResellerAdminController;
use App\Http\Controllers\Api\V1\TenantSmsController;
use App\Http\Controllers\Api\V1\Admin\SubscriptionAdminController;
use App\Http\Controllers\Api\V1\Admin\SupportAdminController;
use App\Http\Controllers\Api\V1\Admin\TenantController as AdminTenantController;
use App\Http\Controllers\Api\V1\Admin\UserAdminController;
use App\Http\Controllers\Api\V1\TenantSettingsController;
use App\Http\Controllers\Api\V1\BillingController;
use App\Http\Controllers\Api\V1\MediaUploadController;
use App\Http\Controllers\Api\V1\OnboardingController;
use App\Http\Controllers\Api\V1\OtpController;
use App\Http\Controllers\Api\V1\PaymentWebhookController;
use App\Http\Controllers\Api\V1\AppointmentController;
use App\Http\Controllers\Api\V1\Admin\UserPasswordController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\PasswordResetController;
use App\Http\Controllers\Api\V1\ClientAccountController;
use App\Http\Controllers\Api\V1\SocialAuthController;
use App\Http\Controllers\Api\V1\BookingAvailabilityController;
use App\Http\Controllers\Api\V1\BookingCatalogController;
use App\Http\Controllers\Api\V1\BookingCouponController;
use App\Http\Controllers\Api\V1\BookingPaymentController;
use App\Http\Controllers\Api\V1\TenantCouponController;
use App\Http\Controllers\Api\V1\BookingWaitlistController;
use App\Http\Controllers\Api\V1\TenantPaymentController;
use App\Http\Controllers\Api\V1\DashboardController;
use App\Http\Controllers\Api\V1\InventoryDashboardController;
use App\Http\Controllers\Api\V1\ProductCategoryController;
use App\Http\Controllers\Api\V1\ProductController;
use App\Http\Controllers\Api\V1\StockMovementController;
use App\Http\Controllers\Api\V1\SupplierController;
use App\Http\Controllers\Api\V1\PosController;
use App\Http\Controllers\Api\V1\SaleController;
use App\Http\Controllers\Api\V1\ReportsController;
use App\Http\Controllers\Api\V1\HealthController;
use App\Http\Controllers\Api\V1\PlatformAbilitiesController;
use App\Http\Controllers\Api\V1\PortfolioGalleryController;
use App\Http\Controllers\Api\V1\ClientController;
use App\Http\Controllers\Api\V1\LocationController;
use App\Http\Controllers\Api\V1\ServiceCategoryController;
use App\Http\Controllers\Api\V1\ServiceController;
use App\Http\Controllers\Api\V1\StaffMemberController;
use App\Http\Controllers\Api\V1\StaffMemberServiceController;
use App\Http\Controllers\Api\V1\StaffWorkingHourController;
use App\Http\Controllers\Api\V1\TenantAbilitiesController;
use App\Http\Controllers\Api\V1\TenantContextController;
use App\Http\Controllers\Api\V1\TenantTeamRoleController;
use App\Http\Middleware\EnsurePermission;
use App\Http\Middleware\EnsureTenantAccess;
use App\Http\Middleware\EnsureTenantIsActive;
use App\Http\Middleware\EnsureTenantResolved;
use App\Http\Middleware\ResolveTenant;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Route parameter constraints
|--------------------------------------------------------------------------
| Prevent /admin/* from matching /{tenantSlug}/* (e.g. admin/reports).
*/
$reservedTenantSlugs = implode('|', array_map(
    fn (string $slug) => preg_quote($slug, '/'),
    config('tenant.reserved_slugs', ['admin'])
));
Route::pattern('tenantSlug', '^(?!('.$reservedTenantSlugs.')$)[a-z0-9][a-z0-9\-]*$');

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
    Route::post('/token', [AuthController::class, 'token']);
    Route::post('/forgot-password', [PasswordResetController::class, 'sendLink']);
    Route::post('/reset-password', [PasswordResetController::class, 'reset']);
    Route::post('/otp/send', [OtpController::class, 'send']);
    Route::post('/otp/verify', [OtpController::class, 'verify']);
    Route::get('/social/{provider}/redirect', [SocialAuthController::class, 'redirect']);
    Route::get('/social/{provider}/callback', [SocialAuthController::class, 'callback']);
});

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::get('/account/tenants', [ClientAccountController::class, 'tenants']);
    Route::get('/auth/platform/abilities', PlatformAbilitiesController::class);
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    Route::prefix('billing')->group(function () {
        Route::post('/coupons/validate', [BillingController::class, 'validateCoupon']);
        Route::post('/checkout', [BillingController::class, 'checkout']);
        Route::get('/verify', [BillingController::class, 'verify']);
        Route::get('/status', [BillingController::class, 'status']);
    });

    Route::get('/onboarding', [OnboardingController::class, 'show']);
    Route::get('/onboarding/service-suggestions', [OnboardingController::class, 'serviceSuggestions']);
    Route::patch('/onboarding/steps/{step}', [OnboardingController::class, 'updateStep']);
    Route::post('/onboarding/tenant', [OnboardingController::class, 'store']);
    Route::post('/onboarding/upload', [MediaUploadController::class, 'store']);
});

/*
|--------------------------------------------------------------------------
| Platform admin (register before /{tenantSlug} routes)
|--------------------------------------------------------------------------
*/
Route::middleware(['auth:sanctum'])
    ->prefix('admin')
    ->group(function () {
        Route::middleware(EnsurePermission::class.':tenants.view')->group(function () {
            Route::get('/appointments', [AdminAppointmentController::class, 'index']);
            Route::get('/appointments/{uuid}', [AdminAppointmentController::class, 'show']);
            Route::patch('/appointments/{uuid}', [AdminAppointmentController::class, 'update']);
            Route::get('/dashboard', AdminDashboardController::class);
            Route::get('/reports', [AdminReportsController::class, 'index']);
            Route::get('/onboarding', [AdminOnboardingController::class, 'index']);
            Route::get('/users', [UserAdminController::class, 'index']);
            Route::get('/users/{user}', [UserAdminController::class, 'show']);
            Route::patch('/users/{user}', [UserAdminController::class, 'update']);
            Route::delete('/users/{user}', [UserAdminController::class, 'destroy']);
            Route::post('/users/{user}/password-reset-link', [UserPasswordController::class, 'sendResetLink']);
            Route::post('/users/{user}/reset-password', [UserPasswordController::class, 'resetAndNotify']);
            Route::get('/tenants', [AdminTenantController::class, 'index']);
            Route::post('/tenants', [AdminTenantController::class, 'store']);
            Route::get('/tenants/{tenant}', [AdminTenantController::class, 'show']);
            Route::patch('/tenants/{tenant}', [AdminTenantController::class, 'update']);
            Route::delete('/tenants/{tenant}', [AdminTenantController::class, 'destroy']);
            Route::get('/domains', [DomainAdminController::class, 'index']);
            Route::get('/support/tickets', [SupportAdminController::class, 'index']);
        });

        Route::middleware(EnsurePermission::class.':billing.manage')->group(function () {
            Route::get('/payments', [BillingAdminController::class, 'payments']);
            Route::get('/payments/failures', [BillingAdminController::class, 'failures']);
            Route::get('/signups/unpaid', [BillingAdminController::class, 'unpaidSignups']);
            Route::get('/subscriptions', [SubscriptionAdminController::class, 'index']);
            Route::get('/plans', [PlanAdminController::class, 'index']);
            Route::post('/plans', [PlanAdminController::class, 'store']);
            Route::patch('/plans/{plan}', [PlanAdminController::class, 'update']);
            Route::delete('/plans/{plan}', [PlanAdminController::class, 'destroy']);
            Route::get('/coupons', [CouponAdminController::class, 'index']);
            Route::post('/coupons', [CouponAdminController::class, 'store']);
            Route::patch('/coupons/{coupon}', [CouponAdminController::class, 'update']);
            Route::delete('/coupons/{coupon}', [CouponAdminController::class, 'destroy']);
            Route::post('/domains', [DomainAdminController::class, 'store']);
            Route::patch('/domains/{domain}', [DomainAdminController::class, 'update']);
            Route::delete('/domains/{domain}', [DomainAdminController::class, 'destroy']);
            Route::get('/sms', [SmsAdminController::class, 'index']);
            Route::get('/sms-reseller/overview', [SmsResellerAdminController::class, 'overview']);
            Route::get('/sms-reseller/provider', [SmsResellerAdminController::class, 'provider']);
            Route::get('/sms-reseller/provider/settings', [SmsResellerAdminController::class, 'providerSettings']);
            Route::patch('/sms-reseller/provider/settings', [SmsResellerAdminController::class, 'updateProviderSettings']);
            Route::post('/sms-reseller/provider/test', [SmsResellerAdminController::class, 'testProvider']);
            Route::post('/sms-reseller/provider/test-sms', [SmsResellerAdminController::class, 'testSms']);
            Route::get('/sms-packages', [SmsPackageAdminController::class, 'index']);
            Route::post('/sms-packages', [SmsPackageAdminController::class, 'store']);
            Route::patch('/sms-packages/{smsPackage}', [SmsPackageAdminController::class, 'update']);
            Route::delete('/sms-packages/{smsPackage}', [SmsPackageAdminController::class, 'destroy']);
            Route::post('/sms-reseller/provider/sync', [SmsResellerAdminController::class, 'syncProvider']);
            Route::get('/sms-reseller/provider/sync-logs', [SmsResellerAdminController::class, 'syncLogs']);
            Route::get('/sms-reseller/wallets', [SmsResellerAdminController::class, 'wallets']);
            Route::get('/sms-reseller/transactions', [SmsResellerAdminController::class, 'transactions']);
            Route::get('/sms-reseller/purchases', [SmsResellerAdminController::class, 'purchases']);
        });
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
        Route::get('/locations', [BookingCatalogController::class, 'locations']);
        Route::get('/availability', BookingAvailabilityController::class);
        Route::post('/appointments', [AppointmentController::class, 'store']);
        Route::post('/waitlist', [BookingWaitlistController::class, 'store']);
        Route::post('/appointments/{uuid}/payments/checkout', [BookingPaymentController::class, 'checkout']);
        Route::get('/payments/verify', [BookingPaymentController::class, 'verify']);
        Route::post('/coupons/validate', [BookingCouponController::class, 'validate']);
        Route::post('/otp/send', [OtpController::class, 'send']);
        Route::post('/otp/verify', [OtpController::class, 'verify']);
    });

/*
|--------------------------------------------------------------------------
| Public booking — workplace slug
|--------------------------------------------------------------------------
| Catalog lives under /book/* so it does not collide with authenticated
| workspace routes like GET /{tenantSlug}/services (admin service list).
*/
Route::middleware([ResolveTenant::class, EnsureTenantResolved::class, EnsureTenantIsActive::class])
    ->prefix('{tenantSlug}')
    ->group(function () {
        Route::get('/context', TenantContextController::class);
    });

Route::middleware([ResolveTenant::class, EnsureTenantResolved::class, EnsureTenantIsActive::class])
    ->prefix('{tenantSlug}/book')
    ->group(function () {
        Route::get('/services', [BookingCatalogController::class, 'services']);
        Route::get('/staff', [BookingCatalogController::class, 'staff']);
        Route::get('/locations', [BookingCatalogController::class, 'locations']);
        Route::get('/availability', BookingAvailabilityController::class);
        Route::post('/appointments', [AppointmentController::class, 'store']);
        Route::post('/waitlist', [BookingWaitlistController::class, 'store']);
        Route::post('/appointments/{uuid}/payments/checkout', [BookingPaymentController::class, 'checkout']);
        Route::get('/payments/verify', [BookingPaymentController::class, 'verify']);
        Route::post('/coupons/validate', [BookingCouponController::class, 'validate']);
        Route::post('/otp/send', [OtpController::class, 'send']);
        Route::post('/otp/verify', [OtpController::class, 'verify']);
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
            Route::get('/dashboard/growth-chart', [DashboardController::class, 'growthChart']);
            Route::get('/dashboard/bookings-breakdown', [DashboardController::class, 'bookingsBreakdown']);
            Route::get('/dashboard/upcoming', [DashboardController::class, 'upcomingAppointments']);
            Route::get('/dashboard/recent', [DashboardController::class, 'recentAppointments']);
            Route::get('/reports', [ReportsController::class, 'index']);
        });

        Route::middleware(EnsurePermission::class.':bookings.view')->group(function () {
            Route::get('/appointments', [AppointmentController::class, 'index']);
            Route::get('/appointments/{uuid}', [AppointmentController::class, 'show']);
            Route::get('/payments', [TenantPaymentController::class, 'index']);
        });

        Route::middleware(EnsurePermission::class.':bookings.create')->group(function () {
            Route::post('/appointments', [AppointmentController::class, 'store']);
        });

        Route::middleware(EnsurePermission::class.':bookings.update')->group(function () {
            Route::patch('/appointments/{uuid}', [AppointmentController::class, 'update']);
        });

        Route::middleware(EnsurePermission::class.':settings.manage')->group(function () {
            Route::get('/settings', [TenantSettingsController::class, 'show']);
            Route::patch('/settings', [TenantSettingsController::class, 'update']);
            Route::post('/settings/upload', [MediaUploadController::class, 'store']);
            Route::get('/coupons', [TenantCouponController::class, 'index']);
            Route::post('/coupons', [TenantCouponController::class, 'store']);
            Route::patch('/coupons/{coupon}', [TenantCouponController::class, 'update']);
            Route::delete('/coupons/{coupon}', [TenantCouponController::class, 'destroy']);
            Route::get('/sms', [TenantSmsController::class, 'index']);
            Route::get('/sms/wallet', [TenantSmsController::class, 'wallet']);
            Route::get('/sms/wallet/transactions', [TenantSmsController::class, 'walletTransactions']);
            Route::get('/sms/packages', [TenantSmsController::class, 'packages']);
            Route::post('/sms/packages/{smsPackage}/purchase', [TenantSmsController::class, 'purchasePackage']);
            Route::post('/sms/purchases/verify', [TenantSmsController::class, 'verifyPurchase']);
        });

        Route::middleware(EnsurePermission::class.':settings.manage|staff.update')->group(function () {
            Route::patch('/team/{user}/role', [TenantTeamRoleController::class, 'update']);
        });

        Route::middleware(EnsurePermission::class.':services.view|settings.manage|inventory.view|pos.view')->group(function () {
            Route::get('/locations', [LocationController::class, 'index']);
        });

        Route::middleware(EnsurePermission::class.':settings.manage')->group(function () {
            Route::post('/locations', [LocationController::class, 'store']);
            Route::patch('/locations/{location}', [LocationController::class, 'update']);
            Route::delete('/locations/{location}', [LocationController::class, 'destroy']);
        });

        Route::middleware(EnsurePermission::class.':services.view|pos.view')->group(function () {
            Route::get('/service-categories', [ServiceCategoryController::class, 'index']);
            Route::get('/services', [ServiceController::class, 'index']);
        });

        Route::middleware(EnsurePermission::class.':services.create')->group(function () {
            Route::post('/service-categories', [ServiceCategoryController::class, 'store']);
            Route::post('/services', [ServiceController::class, 'store']);
        });

        Route::middleware(EnsurePermission::class.':services.update')->group(function () {
            Route::patch('/service-categories/{serviceCategory}', [ServiceCategoryController::class, 'update']);
            Route::patch('/services/{service}', [ServiceController::class, 'update']);
        });

        Route::middleware(EnsurePermission::class.':services.delete')->group(function () {
            Route::delete('/service-categories/{serviceCategory}', [ServiceCategoryController::class, 'destroy']);
            Route::delete('/services/{service}', [ServiceController::class, 'destroy']);
        });

        Route::middleware(EnsurePermission::class.':inventory.view|pos.view')->group(function () {
            Route::get('/inventory/dashboard', [InventoryDashboardController::class, 'show']);
            Route::get('/product-categories', [ProductCategoryController::class, 'index']);
            Route::get('/suppliers', [SupplierController::class, 'index']);
            Route::get('/products', [ProductController::class, 'index']);
            Route::get('/stock-movements', [StockMovementController::class, 'index']);
        });

        Route::middleware(EnsurePermission::class.':pos.view')->group(function () {
            Route::get('/pos/summary', [PosController::class, 'summary']);
            Route::get('/sales', [SaleController::class, 'index']);
            Route::get('/sales/{sale}', [SaleController::class, 'show']);
        });

        Route::middleware(EnsurePermission::class.':pos.create')->group(function () {
            Route::post('/sales', [SaleController::class, 'store']);
            Route::post('/sales/validate-coupon', [SaleController::class, 'validateCoupon']);
        });

        Route::middleware(EnsurePermission::class.':inventory.create')->group(function () {
            Route::post('/product-categories', [ProductCategoryController::class, 'store']);
            Route::post('/suppliers', [SupplierController::class, 'store']);
            Route::post('/products', [ProductController::class, 'store']);
        });

        Route::middleware(EnsurePermission::class.':inventory.update')->group(function () {
            Route::patch('/product-categories/{productCategory}', [ProductCategoryController::class, 'update']);
            Route::patch('/suppliers/{supplier}', [SupplierController::class, 'update']);
            Route::patch('/products/{product}', [ProductController::class, 'update']);
            Route::post('/products/{product}/adjust-stock', [ProductController::class, 'adjustStock']);
        });

        Route::middleware(EnsurePermission::class.':inventory.delete')->group(function () {
            Route::delete('/product-categories/{productCategory}', [ProductCategoryController::class, 'destroy']);
            Route::delete('/suppliers/{supplier}', [SupplierController::class, 'destroy']);
            Route::delete('/products/{product}', [ProductController::class, 'destroy']);
        });

        Route::middleware(EnsurePermission::class.':staff.view')->group(function () {
            Route::get('/staff-members/stats', [StaffMemberController::class, 'stats']);
            Route::get('/staff-members', [StaffMemberController::class, 'index']);
            Route::get('/staff-members/{staffMember}', [StaffMemberController::class, 'show']);
            Route::get('/staff-members/{staffMember}/services', [StaffMemberServiceController::class, 'index']);
            Route::get('/staff-members/{staffMember}/working-hours', [StaffWorkingHourController::class, 'index']);
            Route::get('/services/{service}/staff-members', [StaffMemberServiceController::class, 'staffForService']);
        });

        Route::middleware(EnsurePermission::class.':staff.create')->group(function () {
            Route::post('/staff-members', [StaffMemberController::class, 'store']);
        });

        Route::middleware(EnsurePermission::class.':staff.update')->group(function () {
            Route::patch('/staff-members/{staffMember}', [StaffMemberController::class, 'update']);
            Route::post('/staff-members/{staffMember}/services', [StaffMemberServiceController::class, 'store']);
            Route::put('/staff-members/{staffMember}/services/bulk', [StaffMemberServiceController::class, 'bulk']);
            Route::patch('/staff-members/{staffMember}/services/{staffService}', [StaffMemberServiceController::class, 'update']);
            Route::delete('/staff-members/{staffMember}/services/{staffService}', [StaffMemberServiceController::class, 'destroy']);
            Route::put('/staff-members/{staffMember}/working-hours', [StaffWorkingHourController::class, 'update']);
            Route::post('/staff-members/{staffMember}/working-hours/copy', [StaffWorkingHourController::class, 'copy']);
            Route::post('/staff-members/working-hours/apply', [StaffWorkingHourController::class, 'apply']);
        });

        Route::middleware(EnsurePermission::class.':staff.delete')->group(function () {
            Route::delete('/staff-members/{staffMember}', [StaffMemberController::class, 'destroy']);
        });

        Route::middleware(EnsurePermission::class.':clients.view')->group(function () {
            Route::get('/clients', [ClientController::class, 'index']);
        });

        Route::middleware(EnsurePermission::class.':clients.create')->group(function () {
            Route::post('/clients', [ClientController::class, 'store']);
        });

        Route::middleware(EnsurePermission::class.':clients.update')->group(function () {
            Route::patch('/clients/{client}', [ClientController::class, 'update']);
        });

        Route::middleware(EnsurePermission::class.':clients.delete')->group(function () {
            Route::delete('/clients/{client}', [ClientController::class, 'destroy']);
        });

        Route::middleware(EnsurePermission::class.':services.view')->group(function () {
            Route::get('/portfolio-gallery', [PortfolioGalleryController::class, 'index']);
        });

        Route::middleware(EnsurePermission::class.':services.update')->group(function () {
            Route::post('/portfolio-gallery', [PortfolioGalleryController::class, 'store']);
            Route::post('/portfolio-gallery/sync', [PortfolioGalleryController::class, 'sync']);
            Route::patch('/portfolio-gallery/{galleryItem}', [PortfolioGalleryController::class, 'update']);
            Route::delete('/portfolio-gallery/{galleryItem}', [PortfolioGalleryController::class, 'destroy']);
        });

        Route::prefix('account')->group(function () {
            Route::middleware(EnsurePermission::class.':bookings.view')->group(function () {
                Route::get('/bookings', [ClientAccountController::class, 'bookingHistory']);
                Route::get('/bookings/{uuid}', [ClientAccountController::class, 'showBooking']);
            });
            Route::middleware(EnsurePermission::class.':bookings.create')->group(function () {
                Route::patch('/bookings/{uuid}', [ClientAccountController::class, 'updateBooking']);
            });
            Route::get('/favorites', [ClientAccountController::class, 'favorites']);
            Route::post('/favorites', [ClientAccountController::class, 'storeFavorite']);
            Route::delete('/favorites/{type}/{id}', [ClientAccountController::class, 'destroyFavorite']);
            Route::get('/loyalty', [ClientAccountController::class, 'loyalty']);
            Route::patch('/profile', [ClientAccountController::class, 'updateProfile']);
        });
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
