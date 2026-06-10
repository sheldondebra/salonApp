<?php

use App\Http\Controllers\Api\V1\Admin\AdminAppointmentController;
use App\Http\Controllers\Api\V1\AppointmentController;
use App\Http\Controllers\Api\V1\Admin\AdminDashboardController;
use App\Http\Controllers\Api\V1\Admin\PlatformMetricsController;
use App\Http\Controllers\Api\V1\Admin\AdminReportsController;
use App\Http\Controllers\Api\V1\Admin\AdminMtnMomoProviderController;
use App\Http\Controllers\Api\V1\Admin\AdminPaymentGatewaysController;
use App\Http\Controllers\Api\V1\Admin\AdminTenantWalletController;
use App\Http\Controllers\Api\V1\Admin\AdminOnboardingController;
use App\Http\Controllers\Api\V1\BillingController;
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
use App\Http\Controllers\Api\V1\TenantMtnMomoProviderController;
use App\Http\Controllers\Api\V1\TenantWaitlistController;
use App\Http\Controllers\Api\V1\TenantPaymentSettingController;
use App\Http\Controllers\Api\V1\TenantSettingsController;
use App\Http\Controllers\Api\V1\CheckoutSessionController;
use App\Http\Controllers\Api\V1\MediaUploadController;
use App\Http\Controllers\Api\V1\OnboardingController;
use App\Http\Controllers\Api\V1\OtpController;
use App\Http\Controllers\Api\V1\PaymentRequestController;
use App\Http\Controllers\Api\V1\MtnMomoWebhookController;
use App\Http\Controllers\Api\V1\PaymentWebhookController;
use App\Http\Controllers\Api\V1\StaffBreakController;
use App\Http\Controllers\Api\V1\StaffTimeOffController;
use App\Http\Controllers\Api\V1\ScheduleController;
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
use App\Http\Controllers\Api\V1\TenantWalletController;
use App\Http\Controllers\Api\V1\DashboardController;
use App\Http\Controllers\Api\V1\InventoryDashboardController;
use App\Http\Controllers\Api\V1\ProductCategoryController;
use App\Http\Controllers\Api\V1\ProductController;
use App\Http\Controllers\Api\V1\StockMovementController;
use App\Http\Controllers\Api\V1\SupplierController;
use App\Http\Controllers\Api\V1\PosController;
use App\Http\Controllers\Api\V1\SaleController;
use App\Http\Controllers\Api\V1\FormTemplateController;
use App\Http\Controllers\Api\V1\FormSubmissionController;
use App\Http\Controllers\Api\V1\FinanceAdjustmentController;
use App\Http\Controllers\Api\V1\FinanceDiscountPolicyController;
use App\Http\Controllers\Api\V1\FinanceExpenseController;
use App\Http\Controllers\Api\V1\FinanceRefundController;
use App\Http\Controllers\Api\V1\FinanceCashDrawerController;
use App\Http\Controllers\Api\V1\FinanceInsightsController;
use App\Http\Controllers\Api\V1\FinancePrepaidBalanceController;
use App\Http\Controllers\Api\V1\FinanceProfitLossController;
use App\Http\Controllers\Api\V1\FinanceTaxController;
use App\Http\Controllers\Api\V1\FinancePayrollController;
use App\Http\Controllers\Api\V1\FinanceTipsController;
use App\Http\Controllers\Api\V1\FinanceInvoiceController;
use App\Http\Controllers\Api\V1\FinanceOverviewController;
use App\Http\Controllers\Api\V1\FinanceTransactionsController;
use App\Http\Controllers\Api\V1\GiftCardController;
use App\Http\Controllers\Api\V1\ReportsController;
use App\Http\Controllers\Api\V1\ReportBuilderController;
use App\Http\Controllers\Api\V1\ScheduledReportController;
use App\Http\Controllers\Api\V1\KpiController;
use App\Http\Controllers\Api\V1\AnalyticsInsightsController;
use App\Http\Controllers\Api\V1\ApprovalRequestController;
use App\Http\Controllers\Api\V1\MembershipController;
use App\Http\Controllers\Api\V1\AbandonedBookingController;
use App\Http\Controllers\Api\V1\WorkspaceDashboardController;
use App\Http\Controllers\Api\V1\BranchComparisonController;
use App\Http\Controllers\Api\V1\BranchGroupController;
use App\Http\Controllers\Api\V1\ChairRentalController;
use App\Http\Controllers\Api\V1\ClientDiscoveryController;
use App\Http\Controllers\Api\V1\FeaturedListingController;
use App\Http\Controllers\Api\V1\MarketplaceCommissionController;
use App\Http\Controllers\Api\V1\MarketplaceController;
use App\Http\Controllers\Api\V1\MarketplaceProfileController;
use App\Http\Controllers\Api\V1\MarketingIntegrationController;
use App\Http\Controllers\Api\V1\ProductBundleController;
use App\Http\Controllers\Api\V1\PublicReviewController;
use App\Http\Controllers\Api\V1\PublicStoreController;
use App\Http\Controllers\Api\V1\PurchaseOrderController;
use App\Http\Controllers\Api\V1\RebookingRuleController;
use App\Http\Controllers\Api\V1\ReviewController;
use App\Http\Controllers\Api\V1\ServicePackageController;
use App\Http\Controllers\Api\V1\SocialBookingLinkController;
use App\Http\Controllers\Api\V1\StoreOrderController;
use App\Http\Controllers\Api\V1\SupplierContactController;
use App\Http\Controllers\Api\V1\HealthController;
use App\Http\Controllers\Api\V1\PlatformAbilitiesController;
use App\Http\Controllers\Api\V1\PortfolioGalleryController;
use App\Http\Controllers\Api\V1\ClientController;
use App\Http\Controllers\Api\V1\ClientProfileController;
use App\Http\Controllers\Api\V1\LocationController;
use App\Http\Controllers\Api\V1\ServiceCategoryController;
use App\Http\Controllers\Api\V1\ServiceAddonController;
use App\Http\Controllers\Api\V1\ServiceController;
use App\Http\Controllers\Api\V1\StaffMemberController;
use App\Http\Controllers\Api\V1\StaffPayRoleController;
use App\Http\Controllers\Api\V1\StaffPayrollProfileController;
use App\Http\Controllers\Api\V1\StaffMemberServiceController;
use App\Http\Controllers\Api\V1\StaffWorkingHourController;
use App\Http\Controllers\Api\V1\TenantAbilitiesController;
use App\Http\Controllers\Api\V1\TenantContextController;
use App\Http\Controllers\Api\V1\TenantTeamRoleController;
use App\Http\Controllers\Api\V1\WhiteLabelController;
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

Route::prefix('marketplace')->group(function () {
    Route::get('/featured', [MarketplaceController::class, 'featured']);
    Route::get('/search', [MarketplaceController::class, 'searchNearby']);
    Route::get('/search/nearby', [MarketplaceController::class, 'searchNearby']);
    Route::get('/search/services', [MarketplaceController::class, 'serviceSearch']);
    Route::get('/services', [MarketplaceController::class, 'serviceSearch']);
    Route::get('/profiles/{tenantSlug}', [MarketplaceController::class, 'profile']);
});

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
        Route::middleware(EnsurePermission::class.':office.dashboard.view|tenants.view')->group(function () {
            Route::get('/dashboard', AdminDashboardController::class);
            Route::get('/overview', [AdminDashboardController::class, 'overview']);
            Route::get('/metrics', PlatformMetricsController::class);
        });

        Route::middleware(EnsurePermission::class.':office.operations.view|tenants.view')->group(function () {
            Route::get('/appointments', [AdminAppointmentController::class, 'index']);
            Route::get('/appointments/{uuid}', [AdminAppointmentController::class, 'show']);
            Route::patch('/appointments/{uuid}', [AdminAppointmentController::class, 'update']);
            Route::get('/reports', [AdminReportsController::class, 'index']);
        });

        Route::middleware(EnsurePermission::class.':office.tenants.view|tenants.view')->group(function () {
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
        });

        Route::middleware(EnsurePermission::class.':office.support.view|tenants.view')->group(function () {
            Route::get('/support/tickets', [SupportAdminController::class, 'index']);
        });

        Route::middleware(EnsurePermission::class.':office.finance.view|billing.manage')->group(function () {
            Route::get('/payments', [BillingAdminController::class, 'payments']);
            Route::get('/payments/failures', [BillingAdminController::class, 'failures']);
            Route::get('/signups/unpaid', [BillingAdminController::class, 'unpaidSignups']);
            Route::get('/subscriptions', [SubscriptionAdminController::class, 'index']);
            Route::get('/tenant-wallets', [AdminTenantWalletController::class, 'index']);
            Route::post('/tenants/{tenant}/wallet/adjust', [AdminTenantWalletController::class, 'adjust']);
        });

        Route::middleware(EnsurePermission::class.':office.tenants.view|tenants.view')->group(function () {
            Route::post('/domains', [DomainAdminController::class, 'store']);
            Route::patch('/domains/{domain}', [DomainAdminController::class, 'update']);
            Route::delete('/domains/{domain}', [DomainAdminController::class, 'destroy']);
        });

        Route::middleware(EnsurePermission::class.':office.settings.manage|billing.manage')->group(function () {
            Route::get('/sms', [SmsAdminController::class, 'index']);
            Route::get('/payment-gateways/overview', [AdminPaymentGatewaysController::class, 'overview']);
            Route::get('/payment-providers/mtn-momo', [AdminMtnMomoProviderController::class, 'show']);
            Route::patch('/payment-providers/mtn-momo', [AdminMtnMomoProviderController::class, 'update']);
            Route::post('/payment-providers/mtn-momo/health-check', [AdminMtnMomoProviderController::class, 'healthCheck']);
            Route::get('/plans', [PlanAdminController::class, 'index']);
            Route::post('/plans', [PlanAdminController::class, 'store']);
            Route::patch('/plans/{plan}', [PlanAdminController::class, 'update']);
            Route::delete('/plans/{plan}', [PlanAdminController::class, 'destroy']);
            Route::get('/coupons', [CouponAdminController::class, 'index']);
            Route::post('/coupons', [CouponAdminController::class, 'store']);
            Route::patch('/coupons/{coupon}', [CouponAdminController::class, 'update']);
            Route::delete('/coupons/{coupon}', [CouponAdminController::class, 'destroy']);
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

Route::middleware([ResolveTenant::class, EnsureTenantResolved::class, EnsureTenantIsActive::class])
    ->prefix('{tenantSlug}')
    ->group(function () {
        Route::get('/store/products', [PublicStoreController::class, 'catalog']);
        Route::post('/store/orders', [PublicStoreController::class, 'checkout']);
        Route::get('/reviews', [PublicReviewController::class, 'index']);
        Route::post('/reviews/submit/{token}', [PublicReviewController::class, 'submit']);
        Route::get('/marketplace/public-profile', [MarketplaceController::class, 'tenantProfile']);
        Route::match(['get', 'post'], '/social-booking-links/{socialBookingLink}/track-click', [SocialBookingLinkController::class, 'trackClick']);
        Route::post('/booking-attribution', [SocialBookingLinkController::class, 'storeAttribution']);
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
            Route::get('/analytics/branch-comparison', [WorkspaceDashboardController::class, 'branchComparison']);
        });

        Route::middleware(EnsurePermission::class.':marketing.view')->group(function () {
            Route::get('/marketing/integrations', [MarketingIntegrationController::class, 'index']);
            Route::get('/settings/integrations', [WorkspaceDashboardController::class, 'integrationsSettings']);
            Route::get('/marketing/events', [MarketingIntegrationController::class, 'events']);
            Route::get('/marketing/abandoned-bookings', [WorkspaceDashboardController::class, 'abandonedBookings']);
            Route::get('/marketing/abandoned-bookings/sessions', [AbandonedBookingController::class, 'index']);
            Route::get('/marketing/abandoned-bookings/analytics', [AbandonedBookingController::class, 'analytics']);
            Route::get('/marketing/rebooking', [WorkspaceDashboardController::class, 'rebooking']);
            Route::get('/marketing/rebooking-rules', [RebookingRuleController::class, 'index']);
            Route::get('/marketing/rebooking-rules/suggestions', [RebookingRuleController::class, 'suggestions']);
            Route::get('/marketing/social-links', [WorkspaceDashboardController::class, 'socialLinks']);
            Route::get('/marketing/social-booking-links', [SocialBookingLinkController::class, 'index']);
        });

        Route::middleware(EnsurePermission::class.':marketing.create')->group(function () {
            Route::post('/marketing/events', [MarketingIntegrationController::class, 'storeEvent']);
            Route::post('/marketing/abandoned-bookings', [AbandonedBookingController::class, 'store']);
            Route::post('/marketing/rebooking-rules', [RebookingRuleController::class, 'store']);
            Route::post('/marketing/social-booking-links', [SocialBookingLinkController::class, 'store']);
            Route::post('/marketing/booking-attributions', [SocialBookingLinkController::class, 'storeAttribution']);
        });

        Route::middleware(EnsurePermission::class.':marketing.update')->group(function () {
            Route::patch('/marketing/integrations/{provider}', [MarketingIntegrationController::class, 'update']);
            Route::patch('/settings/integrations', [WorkspaceDashboardController::class, 'updateIntegrationsSettings']);
            Route::patch('/marketing/abandoned-bookings/{abandonedBookingSession}', [AbandonedBookingController::class, 'update']);
            Route::post('/marketing/abandoned-bookings/{abandonedBookingSession}/send-reminder', [AbandonedBookingController::class, 'sendReminder']);
            Route::patch('/marketing/rebooking-rules/{rebookingRule}', [RebookingRuleController::class, 'update']);
            Route::patch('/marketing/social-booking-links/{socialBookingLink}', [SocialBookingLinkController::class, 'update']);
        });

        Route::middleware(EnsurePermission::class.':marketing.delete')->group(function () {
            Route::delete('/marketing/abandoned-bookings/{abandonedBookingSession}', [AbandonedBookingController::class, 'destroy']);
            Route::delete('/marketing/rebooking-rules/{rebookingRule}', [RebookingRuleController::class, 'destroy']);
            Route::delete('/marketing/social-booking-links/{socialBookingLink}', [SocialBookingLinkController::class, 'destroy']);
        });

        Route::middleware(EnsurePermission::class.':finance.view')->group(function () {
            Route::get('/finance/overview', [FinanceOverviewController::class, 'show']);
            Route::get('/finance/transactions', [FinanceTransactionsController::class, 'index']);
            Route::get('/finance/transactions/export', [FinanceTransactionsController::class, 'export']);
            Route::get('/finance/invoices', [FinanceInvoiceController::class, 'index']);
            Route::post('/finance/invoices', [FinanceInvoiceController::class, 'store']);
            Route::post('/finance/invoices/from-booking/{bookingId}', [FinanceInvoiceController::class, 'fromBooking']);
            Route::post('/finance/invoices/from-pos/{saleId}', [FinanceInvoiceController::class, 'fromPosSale']);
            Route::get('/finance/invoices/{invoice}', [FinanceInvoiceController::class, 'show']);
            Route::patch('/finance/invoices/{invoice}', [FinanceInvoiceController::class, 'update']);
            Route::post('/finance/invoices/{invoice}/send', [FinanceInvoiceController::class, 'send']);
            Route::post('/finance/invoices/{invoice}/payments', [FinanceInvoiceController::class, 'recordPayment']);
            Route::post('/finance/invoices/{invoice}/cancel', [FinanceInvoiceController::class, 'cancel']);
            Route::get('/finance/invoices/{invoice}/receipt', [FinanceInvoiceController::class, 'receipt']);
            Route::get('/finance/expenses/categories', [FinanceExpenseController::class, 'categories']);
            Route::get('/finance/expenses', [FinanceExpenseController::class, 'index']);
            Route::post('/finance/expenses', [FinanceExpenseController::class, 'store']);
            Route::get('/finance/expenses/{expense}', [FinanceExpenseController::class, 'show']);
            Route::post('/finance/expenses/{expense}/void', [FinanceExpenseController::class, 'void']);
            Route::get('/finance/tips', [FinanceTipsController::class, 'index']);
            Route::get('/finance/refunds/preview', [FinanceRefundController::class, 'preview']);
            Route::get('/finance/refunds', [FinanceRefundController::class, 'index']);
            Route::post('/finance/refunds', [FinanceRefundController::class, 'store']);
            Route::get('/finance/refunds/{refund}', [FinanceRefundController::class, 'show']);
            Route::get('/finance/adjustments', [FinanceAdjustmentController::class, 'index']);
            Route::post('/finance/adjustments', [FinanceAdjustmentController::class, 'store']);
            Route::get('/finance/cash-drawer/active', [FinanceCashDrawerController::class, 'active']);
            Route::get('/finance/cash-drawer/sessions', [FinanceCashDrawerController::class, 'index']);
            Route::get('/finance/cash-drawer/sessions/{cashDrawerSession}', [FinanceCashDrawerController::class, 'show']);
            Route::get('/finance/tax-rates', [FinanceTaxController::class, 'rates']);
            Route::post('/finance/tax-rates', [FinanceTaxController::class, 'storeRate']);
            Route::patch('/finance/tax-rates/{taxRate}', [FinanceTaxController::class, 'updateRate']);
            Route::get('/finance/taxes/report', [FinanceTaxController::class, 'report']);
            Route::get('/finance/taxes/report/export', [FinanceTaxController::class, 'exportReport']);
            Route::get('/finance/profit-loss', [FinanceProfitLossController::class, 'show']);
            Route::get('/finance/profit-loss/export', [FinanceProfitLossController::class, 'export']);
            Route::get('/finance/prepaid-balances', [FinancePrepaidBalanceController::class, 'show']);
            Route::get('/finance/prepaid-balances/lookup', [FinancePrepaidBalanceController::class, 'lookup']);
            Route::get('/finance/prepaid-balances/export', [FinancePrepaidBalanceController::class, 'export']);
            Route::get('/finance/insights', [FinanceInsightsController::class, 'show']);
        });

        Route::get('/finance/payroll', [FinancePayrollController::class, 'index']);
        Route::get('/finance/payroll/export', [FinancePayrollController::class, 'export']);

        Route::middleware(EnsurePermission::class.':memberships.view')->group(function () {
            Route::get('/memberships/plans', [MembershipController::class, 'index']);
            Route::get('/memberships/plans/{membershipPlan}', [MembershipController::class, 'show']);
            Route::get('/memberships/clients', [MembershipController::class, 'memberships']);
        });

        Route::middleware(EnsurePermission::class.':memberships.create')->group(function () {
            Route::post('/memberships/plans', [MembershipController::class, 'store']);
            Route::post('/memberships/clients', [MembershipController::class, 'assign']);
        });

        Route::middleware(EnsurePermission::class.':memberships.update')->group(function () {
            Route::patch('/memberships/plans/{membershipPlan}', [MembershipController::class, 'update']);
        });

        Route::middleware(EnsurePermission::class.':memberships.delete')->group(function () {
            Route::delete('/memberships/plans/{membershipPlan}', [MembershipController::class, 'destroy']);
        });

        Route::middleware(EnsurePermission::class.':packages.view')->group(function () {
            Route::get('/packages', [ServicePackageController::class, 'index']);
            Route::get('/packages/{servicePackage}', [ServicePackageController::class, 'show']);
            Route::get('/packages/balances', [ServicePackageController::class, 'balances']);
            Route::get('/packages/ledger', [ServicePackageController::class, 'ledger']);
        });

        Route::middleware(EnsurePermission::class.':packages.create')->group(function () {
            Route::post('/packages', [ServicePackageController::class, 'store']);
            Route::post('/packages/sell', [ServicePackageController::class, 'sell']);
        });

        Route::middleware(EnsurePermission::class.':packages.update')->group(function () {
            Route::patch('/packages/{servicePackage}', [ServicePackageController::class, 'update']);
            Route::post('/packages/balances/{clientPackageBalance}/redeem', [ServicePackageController::class, 'redeem']);
            Route::post('/package-redemptions', [ServicePackageController::class, 'redeemLegacy']);
        });

        Route::middleware(EnsurePermission::class.':packages.delete')->group(function () {
            Route::delete('/packages/{servicePackage}', [ServicePackageController::class, 'destroy']);
        });

        Route::middleware(EnsurePermission::class.':gift_cards.view')->group(function () {
            Route::get('/gift-cards', [GiftCardController::class, 'index']);
            Route::get('/gift-cards/code/{code}', [GiftCardController::class, 'showByCode']);
            Route::get('/gift-cards/liability-summary', [GiftCardController::class, 'liabilitySummary']);
        });

        Route::middleware(EnsurePermission::class.':gift_cards.create')->group(function () {
            Route::post('/gift-cards/sell', [GiftCardController::class, 'sell']);
        });

        Route::middleware(EnsurePermission::class.':gift_cards.update')->group(function () {
            Route::post('/gift-cards/{giftCard}/redeem', [GiftCardController::class, 'redeem']);
            Route::post('/gift-cards/{giftCard}/adjust', [GiftCardController::class, 'adjust']);
        });

        Route::middleware(EnsurePermission::class.':reviews.view')->group(function () {
            Route::get('/reviews/settings', [ReviewController::class, 'settings']);
            Route::get('/reviews/requests', [ReviewController::class, 'requests']);
            Route::get('/reviews', [ReviewController::class, 'index']);
        });

        Route::middleware(EnsurePermission::class.':reviews.create')->group(function () {
            Route::post('/reviews/requests/send', [ReviewController::class, 'sendRequest']);
        });

        Route::middleware(EnsurePermission::class.':reviews.update')->group(function () {
            Route::patch('/reviews/settings', [ReviewController::class, 'updateSettings']);
            Route::post('/reviews/requests/{reviewRequest}/google-send', [ReviewController::class, 'googleSend']);
            Route::post('/reviews/{review}/moderate', [ReviewController::class, 'moderate']);
        });

        Route::middleware(EnsurePermission::class.':reports.view')->group(function () {
            Route::get('/report-builder', [ReportBuilderController::class, 'index']);
            Route::get('/report-builder/{reportDefinition}', [ReportBuilderController::class, 'show']);
            Route::get('/report-schedules', [ScheduledReportController::class, 'index']);
            Route::get('/analytics/insights', AnalyticsInsightsController::class);
            Route::get('/kpis', [KpiController::class, 'index']);
            Route::get('/kpis/{kpiTarget}', [KpiController::class, 'show']);
        });

        Route::middleware(EnsurePermission::class.':reports.create')->group(function () {
            Route::post('/report-builder', [ReportBuilderController::class, 'store']);
            Route::post('/report-builder/{reportDefinition}/preview', [ReportBuilderController::class, 'preview']);
            Route::post('/report-schedules', [ScheduledReportController::class, 'store']);
            Route::post('/kpis', [KpiController::class, 'store']);
        });

        Route::middleware(EnsurePermission::class.':reports.update')->group(function () {
            Route::patch('/report-builder/{reportDefinition}', [ReportBuilderController::class, 'update']);
            Route::patch('/report-schedules/{scheduledReport}', [ScheduledReportController::class, 'update']);
            Route::post('/report-schedules/{scheduledReport}/run', [ScheduledReportController::class, 'run']);
            Route::patch('/kpis/{kpiTarget}', [KpiController::class, 'update']);
        });

        Route::middleware(EnsurePermission::class.':reports.delete')->group(function () {
            Route::delete('/report-builder/{reportDefinition}', [ReportBuilderController::class, 'destroy']);
            Route::delete('/report-schedules/{scheduledReport}', [ScheduledReportController::class, 'destroy']);
            Route::delete('/kpis/{kpiTarget}', [KpiController::class, 'destroy']);
        });

        // Frontend/mobile API aliases (Part 2 contract)
        Route::middleware(EnsurePermission::class.':memberships.view')->group(function () {
            Route::get('/membership-plans', [MembershipController::class, 'index']);
            Route::get('/membership-plans/{membershipPlan}', [MembershipController::class, 'show']);
            Route::get('/client-memberships', [MembershipController::class, 'memberships']);
        });
        Route::middleware(EnsurePermission::class.':memberships.create')->group(function () {
            Route::post('/membership-plans', [MembershipController::class, 'store']);
            Route::post('/client-memberships', [MembershipController::class, 'assign']);
        });
        Route::middleware(EnsurePermission::class.':memberships.update')->group(function () {
            Route::patch('/membership-plans/{membershipPlan}', [MembershipController::class, 'update']);
        });
        Route::middleware(EnsurePermission::class.':memberships.delete')->group(function () {
            Route::delete('/membership-plans/{membershipPlan}', [MembershipController::class, 'destroy']);
        });

        Route::middleware(EnsurePermission::class.':packages.view')->group(function () {
            Route::get('/service-packages', [ServicePackageController::class, 'index']);
            Route::get('/service-packages/{servicePackage}', [ServicePackageController::class, 'show']);
            Route::get('/client-packages', [ServicePackageController::class, 'balances']);
            Route::get('/package-redemptions', [ServicePackageController::class, 'ledger']);
            Route::get('/packages/ledger', [ServicePackageController::class, 'ledger']);
        });
        Route::middleware(EnsurePermission::class.':packages.create')->group(function () {
            Route::post('/service-packages', [ServicePackageController::class, 'store']);
            Route::post('/client-packages/sell', [ServicePackageController::class, 'sell']);
        });
        Route::middleware(EnsurePermission::class.':packages.update')->group(function () {
            Route::patch('/service-packages/{servicePackage}', [ServicePackageController::class, 'update']);
            Route::post('/package-redemptions', [ServicePackageController::class, 'redeemLegacy']);
        });
        Route::middleware(EnsurePermission::class.':packages.delete')->group(function () {
            Route::delete('/service-packages/{servicePackage}', [ServicePackageController::class, 'destroy']);
        });

        Route::middleware(EnsurePermission::class.':gift_cards.view')->group(function () {
            Route::get('/gift-cards/liability', [GiftCardController::class, 'liabilitySummary']);
            Route::get('/gift-cards/lookup', [GiftCardController::class, 'lookupQuery']);
        });
        Route::middleware(EnsurePermission::class.':gift_cards.create')->group(function () {
            Route::post('/gift-cards', [GiftCardController::class, 'sell']);
        });

        Route::middleware(EnsurePermission::class.':reviews.view')->group(function () {
            Route::get('/review-settings', [ReviewController::class, 'settings']);
            Route::get('/review-requests', [ReviewController::class, 'requests']);
            Route::get('/complaint-cases', [ReviewController::class, 'complaintCases']);
        });
        Route::middleware(EnsurePermission::class.':reviews.update')->group(function () {
            Route::patch('/review-settings', [ReviewController::class, 'updateSettings']);
        });

        Route::middleware(EnsurePermission::class.':reports.view')->group(function () {
            Route::get('/report-definitions', [ReportBuilderController::class, 'index']);
            Route::get('/report-definitions/{reportDefinition}', [ReportBuilderController::class, 'show']);
            Route::get('/scheduled-reports', [ScheduledReportController::class, 'index']);
            Route::get('/kpi-targets', [KpiController::class, 'dashboard']);
            Route::get('/analytics/occupancy', [AnalyticsInsightsController::class, 'occupancy']);
            Route::get('/analytics/retention', [AnalyticsInsightsController::class, 'retention']);
        });
        Route::middleware(EnsurePermission::class.':reports.create')->group(function () {
            Route::post('/report-definitions', [ReportBuilderController::class, 'store']);
            Route::post('/report-definitions/preview', [ReportBuilderController::class, 'previewDraft']);
            Route::post('/scheduled-reports', [ScheduledReportController::class, 'store']);
            Route::post('/kpi-targets', [KpiController::class, 'store']);
        });
        Route::middleware(EnsurePermission::class.':reports.update')->group(function () {
            Route::patch('/report-definitions/{reportDefinition}', [ReportBuilderController::class, 'update']);
            Route::patch('/scheduled-reports/{scheduledReport}', [ScheduledReportController::class, 'update']);
            Route::patch('/kpi-targets/{kpiTarget}', [KpiController::class, 'update']);
        });
        Route::middleware(EnsurePermission::class.':reports.delete')->group(function () {
            Route::delete('/report-definitions/{reportDefinition}', [ReportBuilderController::class, 'destroy']);
            Route::delete('/scheduled-reports/{scheduledReport}', [ScheduledReportController::class, 'destroy']);
            Route::delete('/kpi-targets/{kpiTarget}', [KpiController::class, 'destroy']);
        });

        Route::middleware(EnsurePermission::class.':inventory.view|pos.view')->group(function () {
            Route::get('/product-bundles', [ProductBundleController::class, 'index']);
            Route::get('/product-bundles/{productBundle}', [ProductBundleController::class, 'show']);
        });
        Route::middleware(EnsurePermission::class.':inventory.create')->group(function () {
            Route::post('/product-bundles', [ProductBundleController::class, 'store']);
        });
        Route::middleware(EnsurePermission::class.':inventory.update')->group(function () {
            Route::patch('/product-bundles/{productBundle}', [ProductBundleController::class, 'update']);
        });
        Route::middleware(EnsurePermission::class.':inventory.delete')->group(function () {
            Route::delete('/product-bundles/{productBundle}', [ProductBundleController::class, 'destroy']);
        });

        Route::middleware(EnsurePermission::class.':bookings.view')->group(function () {
            Route::get('/appointments', [AppointmentController::class, 'index']);
            Route::get('/appointments/{uuid}', [AppointmentController::class, 'show']);
            Route::get('/schedule/events', [ScheduleController::class, 'index']);
            Route::get('/payments', [TenantPaymentController::class, 'index']);
            Route::get('/waitlist', [TenantWaitlistController::class, 'index']);
            Route::get('/waitlist/{waitlistEntry}', [TenantWaitlistController::class, 'show']);
            Route::get('/waitlist/{waitlistEntry}/openings', [TenantWaitlistController::class, 'openings']);
        });

        Route::middleware(EnsurePermission::class.':wallet.view')->group(function () {
            Route::get('/wallet', [TenantWalletController::class, 'show']);
            Route::get('/wallet/transactions', [TenantWalletController::class, 'transactions']);
        });

        Route::middleware(EnsurePermission::class.':wallet.export')->group(function () {
            Route::get('/wallet/transactions/export', [TenantWalletController::class, 'export']);
        });

        Route::middleware(EnsurePermission::class.':payment_requests.view')->group(function () {
            Route::get('/payment-requests', [PaymentRequestController::class, 'index']);
            Route::get('/payment-requests/{paymentRequest}', [PaymentRequestController::class, 'show']);
        });

        Route::middleware(EnsurePermission::class.':payment_requests.create')->group(function () {
            Route::post('/payment-requests', [PaymentRequestController::class, 'store']);
        });

        Route::middleware(EnsurePermission::class.':payment_requests.verify')->group(function () {
            Route::post('/payment-requests/{paymentRequest}/verify', [PaymentRequestController::class, 'verify']);
        });

        Route::middleware(EnsurePermission::class.':payment_requests.cancel')->group(function () {
            Route::post('/payment-requests/{paymentRequest}/cancel', [PaymentRequestController::class, 'cancel']);
        });

        Route::middleware(EnsurePermission::class.':payment_requests.retry')->group(function () {
            Route::post('/payment-requests/{paymentRequest}/retry', [PaymentRequestController::class, 'retry']);
        });

        Route::middleware(EnsurePermission::class.':bookings.create')->group(function () {
            Route::post('/appointments', [AppointmentController::class, 'store']);
            Route::post('/waitlist', [TenantWaitlistController::class, 'store']);
            Route::post('/waitlist/{waitlistEntry}/notify', [TenantWaitlistController::class, 'notify']);
            Route::post('/waitlist/{waitlistEntry}/convert', [TenantWaitlistController::class, 'convert']);
        });

        Route::middleware(EnsurePermission::class.':bookings.update')->group(function () {
            Route::patch('/appointments/{uuid}', [AppointmentController::class, 'update']);
            Route::patch('/waitlist/{waitlistEntry}', [TenantWaitlistController::class, 'update']);
            Route::delete('/waitlist/{waitlistEntry}', [TenantWaitlistController::class, 'destroy']);
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
            Route::get('/payment-settings', [TenantPaymentSettingController::class, 'show']);
            Route::patch('/payment-settings', [TenantPaymentSettingController::class, 'update']);
            Route::get('/payment-providers/mtn-momo', [TenantMtnMomoProviderController::class, 'show']);
            Route::post('/payment-providers/mtn-momo/request-connection', [TenantMtnMomoProviderController::class, 'requestConnection']);
            Route::patch('/payment-providers/mtn-momo', [TenantMtnMomoProviderController::class, 'update']);
            Route::post('/payment-providers/mtn-momo/health-check', [TenantMtnMomoProviderController::class, 'healthCheck']);
            Route::get('/operations/branch-groups', [BranchGroupController::class, 'index']);
            Route::get('/branches/groups', [WorkspaceDashboardController::class, 'branchGroups']);
            Route::post('/operations/branch-groups', [BranchGroupController::class, 'store']);
            Route::patch('/operations/branch-groups/{branchGroup}', [BranchGroupController::class, 'update']);
            Route::delete('/operations/branch-groups/{branchGroup}', [BranchGroupController::class, 'destroy']);
            Route::get('/operations/branch-overrides', [BranchGroupController::class, 'overrides']);
            Route::post('/operations/branch-overrides/{location}', [BranchGroupController::class, 'saveOverride']);
            Route::delete('/operations/branch-overrides/{branchSettingOverride}', [BranchGroupController::class, 'destroyOverride']);
            Route::get('/white-label', [WhiteLabelController::class, 'show']);
            Route::get('/settings/white-label', [WorkspaceDashboardController::class, 'whiteLabelSettings']);
            Route::get('/enterprise/white-label-preview', [WorkspaceDashboardController::class, 'whiteLabelPreview']);
            Route::patch('/settings/white-label', [WorkspaceDashboardController::class, 'updateWhiteLabelSettings']);
            Route::patch('/white-label', [WhiteLabelController::class, 'update']);
        });

        Route::middleware(EnsurePermission::class.':marketplace.view')->group(function () {
            Route::get('/marketplace/profile', [WorkspaceDashboardController::class, 'marketplaceProfile']);
            Route::get('/marketplace/featured', [WorkspaceDashboardController::class, 'marketplaceFeatured']);
            Route::get('/marketplace/featured-listings', [FeaturedListingController::class, 'index']);
            Route::get('/marketplace/commissions', [WorkspaceDashboardController::class, 'marketplaceCommissions']);
            Route::get('/marketplace/commission-rules', [MarketplaceCommissionController::class, 'index']);
        });

        Route::middleware(EnsurePermission::class.':marketplace.create')->group(function () {
            Route::post('/marketplace/featured-listings', [FeaturedListingController::class, 'store']);
            Route::post('/marketplace/commission-rules', [MarketplaceCommissionController::class, 'store']);
        });

        Route::middleware(EnsurePermission::class.':marketplace.update')->group(function () {
            Route::patch('/marketplace/profile', [MarketplaceProfileController::class, 'update']);
            Route::patch('/marketplace/featured-listings/{featuredListing}', [FeaturedListingController::class, 'update']);
            Route::patch('/marketplace/commission-rules/{marketplaceCommissionRule}', [MarketplaceCommissionController::class, 'update']);
        });

        Route::middleware(EnsurePermission::class.':marketplace.delete')->group(function () {
            Route::delete('/marketplace/featured-listings/{featuredListing}', [FeaturedListingController::class, 'destroy']);
            Route::delete('/marketplace/commission-rules/{marketplaceCommissionRule}', [MarketplaceCommissionController::class, 'destroy']);
        });

        Route::middleware(EnsurePermission::class.':approvals.view')->group(function () {
            Route::get('/approvals/inbox', [ApprovalRequestController::class, 'inbox']);
            Route::get('/approvals', [WorkspaceDashboardController::class, 'approvals']);
            Route::get('/enterprise/approvals', [WorkspaceDashboardController::class, 'approvals']);
        });

        Route::middleware(EnsurePermission::class.':approvals.create')->group(function () {
            Route::post('/approvals', [ApprovalRequestController::class, 'store']);
        });

        Route::middleware(EnsurePermission::class.':approvals.update')->group(function () {
            Route::post('/approvals/{approvalRequest}/approve', [ApprovalRequestController::class, 'approve']);
            Route::post('/approvals/{approvalRequest}/reject', [ApprovalRequestController::class, 'reject']);
            Route::post('/enterprise/approvals/{approvalRequest}', [WorkspaceDashboardController::class, 'resolveApproval']);
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
            Route::get('/products/barcode/{code}', [ProductController::class, 'barcode']);
            Route::get('/stock-movements', [StockMovementController::class, 'index']);
            Route::get('/bundles', [ProductBundleController::class, 'index']);
            Route::get('/bundles/{productBundle}', [ProductBundleController::class, 'show']);
            Route::get('/bundles/{productBundle}/pos', [ProductBundleController::class, 'pos']);
            Route::get('/purchase-orders', [PurchaseOrderController::class, 'index']);
            Route::get('/purchase-orders/{purchaseOrder}', [PurchaseOrderController::class, 'show']);
            Route::get('/store/orders', [StoreOrderController::class, 'index']);
            Route::get('/store/orders/{storeOrder}', [StoreOrderController::class, 'show']);
            Route::get('/suppliers/{supplier}/contacts', [SupplierContactController::class, 'index']);
        });

        Route::middleware(EnsurePermission::class.':pos.view')->group(function () {
            Route::get('/pos/summary', [PosController::class, 'summary']);
            Route::get('/sales', [SaleController::class, 'index']);
            Route::get('/sales/{sale}', [SaleController::class, 'show']);
            Route::get('/checkout-sessions/{checkoutSession}', [CheckoutSessionController::class, 'show']);
            Route::get('/services/{service}/addons', [ServiceAddonController::class, 'index']);
        });

        Route::middleware(EnsurePermission::class.':pos.create')->group(function () {
            Route::get('/finance/discount-policy', [FinanceDiscountPolicyController::class, 'show']);
            Route::post('/sales', [SaleController::class, 'store']);
            Route::post('/sales/preview', [SaleController::class, 'preview']);
            Route::post('/sales/validate-coupon', [SaleController::class, 'validateCoupon']);
            Route::post('/checkout-sessions', [CheckoutSessionController::class, 'store']);
            Route::patch('/checkout-sessions/{checkoutSession}', [CheckoutSessionController::class, 'update']);
            Route::post('/checkout-sessions/{checkoutSession}/complete', [CheckoutSessionController::class, 'complete']);
            Route::post('/finance/cash-drawer/open', [FinanceCashDrawerController::class, 'open']);
            Route::post('/finance/cash-drawer/sessions/{cashDrawerSession}/close', [FinanceCashDrawerController::class, 'close']);
            Route::post('/finance/tax-rates/preview', [FinanceTaxController::class, 'preview']);
        });

        Route::middleware(EnsurePermission::class.':inventory.create')->group(function () {
            Route::post('/product-categories', [ProductCategoryController::class, 'store']);
            Route::post('/suppliers', [SupplierController::class, 'store']);
            Route::post('/suppliers/{supplier}/contacts', [SupplierContactController::class, 'store']);
            Route::post('/products', [ProductController::class, 'store']);
            Route::post('/bundles', [ProductBundleController::class, 'store']);
            Route::post('/purchase-orders', [PurchaseOrderController::class, 'store']);
        });

        Route::middleware(EnsurePermission::class.':inventory.update')->group(function () {
            Route::patch('/product-categories/{productCategory}', [ProductCategoryController::class, 'update']);
            Route::patch('/suppliers/{supplier}', [SupplierController::class, 'update']);
            Route::patch('/suppliers/{supplier}/contacts/{supplierContact}', [SupplierContactController::class, 'update']);
            Route::patch('/products/{product}', [ProductController::class, 'update']);
            Route::post('/products/{product}/adjust-stock', [ProductController::class, 'adjustStock']);
            Route::patch('/bundles/{productBundle}', [ProductBundleController::class, 'update']);
            Route::patch('/purchase-orders/{purchaseOrder}', [PurchaseOrderController::class, 'update']);
            Route::post('/purchase-orders/{purchaseOrder}/send', [PurchaseOrderController::class, 'send']);
            Route::post('/purchase-orders/{purchaseOrder}/receive', [PurchaseOrderController::class, 'receive']);
        });

        Route::middleware(EnsurePermission::class.':inventory.delete')->group(function () {
            Route::delete('/product-categories/{productCategory}', [ProductCategoryController::class, 'destroy']);
            Route::delete('/suppliers/{supplier}', [SupplierController::class, 'destroy']);
            Route::delete('/suppliers/{supplier}/contacts/{supplierContact}', [SupplierContactController::class, 'destroy']);
            Route::delete('/products/{product}', [ProductController::class, 'destroy']);
            Route::delete('/bundles/{productBundle}', [ProductBundleController::class, 'destroy']);
        });

        Route::middleware(EnsurePermission::class.':staff.view')->group(function () {
            Route::get('/staff-members/stats', [StaffMemberController::class, 'stats']);
            Route::get('/staff-members', [StaffMemberController::class, 'index']);
            Route::get('/staff-members/{staffMember}', [StaffMemberController::class, 'show']);
            Route::get('/staff-members/{staffMember}/services', [StaffMemberServiceController::class, 'index']);
            Route::get('/staff-members/{staffMember}/working-hours', [StaffWorkingHourController::class, 'index']);
            Route::get('/staff-members/{staffMember}/breaks', [StaffBreakController::class, 'index']);
            Route::get('/staff-members/{staffMember}/time-off', [StaffTimeOffController::class, 'index']);
            Route::get('/staff-members/{staffMember}/payroll', [StaffPayrollProfileController::class, 'show']);
            Route::get('/staff-members/{staffMember}/self-employed', [StaffMemberController::class, 'selfEmployedShow']);
            Route::get('/pay-roles', [StaffPayRoleController::class, 'index']);
            Route::get('/services/{service}/staff-members', [StaffMemberServiceController::class, 'staffForService']);
            Route::get('/chair-rentals', [WorkspaceDashboardController::class, 'chairRentals']);
            Route::get('/chair-rentals/sessions', [ChairRentalController::class, 'index']);
            Route::get('/enterprise/chair-rentals', [WorkspaceDashboardController::class, 'chairRentals']);
        });

        Route::middleware(EnsurePermission::class.':staff.create')->group(function () {
            Route::post('/staff-members', [StaffMemberController::class, 'store']);
        });

        Route::middleware(EnsurePermission::class.':staff.update')->group(function () {
            Route::patch('/staff-members/{staffMember}', [StaffMemberController::class, 'update']);
            Route::patch('/staff-members/{staffMember}/self-employed', [StaffMemberController::class, 'selfEmployedUpdate']);
            Route::patch('/staff-members/{staffMember}/payroll', [StaffPayrollProfileController::class, 'update']);
            Route::post('/pay-roles', [StaffPayRoleController::class, 'store']);
            Route::patch('/pay-roles/{payRole}', [StaffPayRoleController::class, 'update']);
            Route::delete('/pay-roles/{payRole}', [StaffPayRoleController::class, 'destroy']);
            Route::post('/staff-members/{staffMember}/services', [StaffMemberServiceController::class, 'store']);
            Route::put('/staff-members/{staffMember}/services/bulk', [StaffMemberServiceController::class, 'bulk']);
            Route::patch('/staff-members/{staffMember}/services/{staffService}', [StaffMemberServiceController::class, 'update']);
            Route::delete('/staff-members/{staffMember}/services/{staffService}', [StaffMemberServiceController::class, 'destroy']);
            Route::put('/staff-members/{staffMember}/working-hours', [StaffWorkingHourController::class, 'update']);
            Route::post('/staff-members/{staffMember}/working-hours/copy', [StaffWorkingHourController::class, 'copy']);
            Route::post('/staff-members/working-hours/apply', [StaffWorkingHourController::class, 'apply']);
            Route::post('/staff-members/{staffMember}/breaks', [StaffBreakController::class, 'store']);
            Route::patch('/staff-members/{staffMember}/breaks/{staffBreak}', [StaffBreakController::class, 'update']);
            Route::delete('/staff-members/{staffMember}/breaks/{staffBreak}', [StaffBreakController::class, 'destroy']);
            Route::post('/staff-members/{staffMember}/time-off', [StaffTimeOffController::class, 'store']);
            Route::patch('/staff-members/{staffMember}/time-off/{staffTimeOff}', [StaffTimeOffController::class, 'update']);
            Route::put('/staff-members/{staffMember}/chair-rental', [ChairRentalController::class, 'upsert']);
            Route::delete('/chair-rentals/{chairRentalProfile}', [ChairRentalController::class, 'destroy']);
        });

        Route::middleware(EnsurePermission::class.':staff.delete')->group(function () {
            Route::delete('/staff-members/{staffMember}', [StaffMemberController::class, 'destroy']);
        });

        Route::middleware(EnsurePermission::class.':clients.view')->group(function () {
            Route::get('/clients', [ClientController::class, 'index']);
            Route::get('/clients/{client}/profile', [ClientProfileController::class, 'show']);
        });

        Route::middleware(EnsurePermission::class.':clients.create')->group(function () {
            Route::post('/clients', [ClientController::class, 'store']);
        });

        Route::middleware(EnsurePermission::class.':clients.update')->group(function () {
            Route::patch('/clients/{client}', [ClientController::class, 'update']);
            Route::patch('/clients/{client}/profile', [ClientProfileController::class, 'update']);
            Route::post('/clients/{client}/notes', [ClientProfileController::class, 'storeNote']);
            Route::delete('/clients/{client}/notes/{note}', [ClientProfileController::class, 'destroyNote']);
            Route::post('/clients/{client}/allergies', [ClientProfileController::class, 'storeAllergy']);
            Route::delete('/clients/{client}/allergies/{allergy}', [ClientProfileController::class, 'destroyAllergy']);
            Route::post('/clients/{client}/patch-tests', [ClientProfileController::class, 'storePatchTest']);
            Route::delete('/clients/{client}/patch-tests/{patchTest}', [ClientProfileController::class, 'destroyPatchTest']);
            Route::post('/clients/{client}/treatments', [ClientProfileController::class, 'storeTreatment']);
            Route::delete('/clients/{client}/treatments/{treatment}', [ClientProfileController::class, 'destroyTreatment']);
            Route::post('/clients/{client}/media', [ClientProfileController::class, 'storeMedia']);
            Route::delete('/clients/{client}/media/{medium}', [ClientProfileController::class, 'destroyMedia']);
            Route::post('/clients/{client}/documents', [ClientProfileController::class, 'storeDocument']);
            Route::delete('/clients/{client}/documents/{document}', [ClientProfileController::class, 'destroyDocument']);
        });

        Route::middleware(EnsurePermission::class.':clients.delete')->group(function () {
            Route::delete('/clients/{client}', [ClientController::class, 'destroy']);
        });

        Route::middleware(EnsurePermission::class.':forms.view')->group(function () {
            Route::get('/forms', [FormTemplateController::class, 'index']);
            Route::get('/forms/library', [FormTemplateController::class, 'library']);
            Route::get('/forms/{formTemplate}', [FormTemplateController::class, 'show']);
            Route::get('/form-submissions', [FormSubmissionController::class, 'index']);
            Route::get('/form-submissions/{formSubmission}', [FormSubmissionController::class, 'show']);
        });

        Route::middleware(EnsurePermission::class.':forms.create')->group(function () {
            Route::post('/forms', [FormTemplateController::class, 'store']);
            Route::post('/forms/library/import', [FormTemplateController::class, 'importLibrary']);
            Route::post('/forms/{formTemplate}/submissions', [FormSubmissionController::class, 'store']);
        });

        Route::middleware(EnsurePermission::class.':forms.update')->group(function () {
            Route::patch('/forms/{formTemplate}', [FormTemplateController::class, 'update']);
        });

        Route::middleware(EnsurePermission::class.':forms.delete')->group(function () {
            Route::delete('/forms/{formTemplate}', [FormTemplateController::class, 'destroy']);
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
            Route::get('/discovery', [ClientAccountController::class, 'discovery']);
            Route::post('/favorites', [ClientAccountController::class, 'storeFavorite']);
            Route::delete('/favorites/{type}/{id}', [ClientAccountController::class, 'destroyFavorite']);
            Route::get('/discovery/favorites', [ClientDiscoveryController::class, 'favorites']);
            Route::post('/discovery/favorites', [ClientDiscoveryController::class, 'addFavorite']);
            Route::delete('/discovery/favorites/{businessSlug}', [ClientDiscoveryController::class, 'removeFavorite']);
            Route::get('/discovery/recently-viewed', [ClientDiscoveryController::class, 'recentlyViewed']);
            Route::post('/discovery/recently-viewed', [ClientDiscoveryController::class, 'markViewed']);
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
    Route::post('/mtn-momo', [MtnMomoWebhookController::class, 'callback']);
});
