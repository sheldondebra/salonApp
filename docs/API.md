# Schedelux API Reference

Auto-generated from Laravel route definitions. Base URL: `http://localhost:8000/api/v1` (production: your API host + `/api/v1`).

**Total endpoints:** 506

Related docs: [AUTHENTICATION.md](./AUTHENTICATION.md) · [PERMISSIONS.md](./PERMISSIONS.md) · [MULTI-TENANCY.md](./MULTI-TENANCY.md)

## Authentication

| Flow | Header / cookie | Notes |
|------|-----------------|-------|
| Web (Next.js) | Session cookie + CSRF | `POST /auth/login` after `GET /sanctum/csrf-cookie` |
| Mobile / API clients | `Authorization: Bearer {token}` | `POST /auth/token` |
| Tenant workspace | Bearer + tenant context | Path `/{tenantSlug}/…` or tenant custom domain |
| Public booking | None | Custom domain `/api/v1/booking/…` or `/{tenantSlug}/book/…` |

Permissions use Spatie roles. Endpoints with a **Permission** value require that ability on the tenant team (or platform role for `/admin/*`).

## Quick reference by area

| Area | Prefix | Auth |
|------|--------|------|
| Health | `/health` | Public |
| Auth & account | `/auth/*`, `/me`, `/account/*` | Mixed |
| Platform admin | `/admin/*` | Bearer (super admin permissions) |
| Public booking (domain) | `/booking/*` | Public + tenant domain |
| Public booking (slug) | `/{tenantSlug}/book/*` | Public |
| Tenant workspace | `/{tenantSlug}/*` | Bearer + tenant membership |
| Webhooks | `/webhooks/*` | Provider signatures (no user auth) |

## Table of contents

- [health](#health) (1)
- [billing](#billing) (5)
- [marketplace](#marketplace) (6)
- [auth](#auth) (11)
- [account](#account) (1)
- [onboarding](#onboarding) (5)
- [admin](#admin) (58)
- [booking](#booking) (12)
- [webhooks](#webhooks) (3)
- [integrations](#integrations) (1)
- [me](#me) (1)
- [Tenant › account](#tenant-account) (14)
- [Tenant › analytics](#tenant-analytics) (4)
- [Tenant › appointments](#tenant-appointments) (4)
- [Tenant › approvals](#tenant-approvals) (5)
- [Tenant › auth](#tenant-auth) (1)
- [Tenant › book](#tenant-book) (11)
- [Tenant › booking-attribution](#tenant-booking-attribution) (1)
- [Tenant › branches](#tenant-branches) (1)
- [Tenant › bundles](#tenant-bundles) (6)
- [Tenant › chair-rentals](#tenant-chair-rentals) (3)
- [Tenant › checkout-sessions](#tenant-checkout-sessions) (4)
- [Tenant › client-memberships](#tenant-client-memberships) (2)
- [Tenant › client-packages](#tenant-client-packages) (2)
- [Tenant › clients](#tenant-clients) (18)
- [Tenant › complaint-cases](#tenant-complaint-cases) (1)
- [Tenant › context](#tenant-context) (1)
- [Tenant › coupons](#tenant-coupons) (4)
- [Tenant › dashboard](#tenant-dashboard) (6)
- [Tenant › enterprise](#tenant-enterprise) (4)
- [Tenant › finance](#tenant-finance) (45)
- [Tenant › form-submissions](#tenant-form-submissions) (2)
- [Tenant › forms](#tenant-forms) (8)
- [Tenant › gift-cards](#tenant-gift-cards) (9)
- [Tenant › inventory](#tenant-inventory) (1)
- [Tenant › kpi-targets](#tenant-kpi-targets) (4)
- [Tenant › kpis](#tenant-kpis) (5)
- [Tenant › locations](#tenant-locations) (4)
- [Tenant › marketing](#tenant-marketing) (23)
- [Tenant › marketplace](#tenant-marketplace) (13)
- [Tenant › membership-plans](#tenant-membership-plans) (5)
- [Tenant › memberships](#tenant-memberships) (7)
- [Tenant › operations](#tenant-operations) (7)
- [Tenant › package-redemptions](#tenant-package-redemptions) (2)
- [Tenant › packages](#tenant-packages) (9)
- [Tenant › pay-roles](#tenant-pay-roles) (4)
- [Tenant › payment-providers](#tenant-payment-providers) (4)
- [Tenant › payment-requests](#tenant-payment-requests) (6)
- [Tenant › payment-settings](#tenant-payment-settings) (2)
- [Tenant › payments](#tenant-payments) (1)
- [Tenant › portfolio-gallery](#tenant-portfolio-gallery) (5)
- [Tenant › pos](#tenant-pos) (1)
- [Tenant › product-bundles](#tenant-product-bundles) (5)
- [Tenant › product-categories](#tenant-product-categories) (4)
- [Tenant › products](#tenant-products) (6)
- [Tenant › purchase-orders](#tenant-purchase-orders) (6)
- [Tenant › report-builder](#tenant-report-builder) (6)
- [Tenant › report-definitions](#tenant-report-definitions) (6)
- [Tenant › report-schedules](#tenant-report-schedules) (5)
- [Tenant › reports](#tenant-reports) (1)
- [Tenant › review-requests](#tenant-review-requests) (1)
- [Tenant › review-settings](#tenant-review-settings) (2)
- [Tenant › reviews](#tenant-reviews) (8)
- [Tenant › sales](#tenant-sales) (5)
- [Tenant › schedule](#tenant-schedule) (1)
- [Tenant › scheduled-reports](#tenant-scheduled-reports) (4)
- [Tenant › service-categories](#tenant-service-categories) (4)
- [Tenant › service-packages](#tenant-service-packages) (5)
- [Tenant › services](#tenant-services) (6)
- [Tenant › settings](#tenant-settings) (7)
- [Tenant › sms](#tenant-sms) (6)
- [Tenant › social-booking-links](#tenant-social-booking-links) (1)
- [Tenant › staff-members](#tenant-staff-members) (27)
- [Tenant › stock-movements](#tenant-stock-movements) (1)
- [Tenant › store](#tenant-store) (4)
- [Tenant › suppliers](#tenant-suppliers) (8)
- [Tenant › team](#tenant-team) (1)
- [Tenant › waitlist](#tenant-waitlist) (8)
- [Tenant › wallet](#tenant-wallet) (3)
- [Tenant › white-label](#tenant-white-label) (2)

---

## health {#health}

| Method | Endpoint | Auth | Permission | Handler |
|--------|----------|------|------------|---------|
| GET | `/api/v1/health` | Public | — | `HealthController` |

## billing {#billing}

| Method | Endpoint | Auth | Permission | Handler |
|--------|----------|------|------------|---------|
| POST | `/api/v1/billing/checkout` | Bearer | — | `BillingController@checkout` |
| POST | `/api/v1/billing/coupons/validate` | Bearer | — | `BillingController@validateCoupon` |
| GET | `/api/v1/billing/plans` | Public | — | `BillingController@plans` |
| GET | `/api/v1/billing/status` | Bearer | — | `BillingController@status` |
| GET | `/api/v1/billing/verify` | Bearer | — | `BillingController@verify` |

## marketplace {#marketplace}

| Method | Endpoint | Auth | Permission | Handler |
|--------|----------|------|------------|---------|
| GET | `/api/v1/marketplace/featured` | Public | — | `MarketplaceController@featured` |
| GET | `/api/v1/marketplace/profiles/{tenantSlug}` | Public | — | `MarketplaceController@profile` |
| GET | `/api/v1/marketplace/search` | Public | — | `MarketplaceController@searchNearby` |
| GET | `/api/v1/marketplace/search/nearby` | Public | — | `MarketplaceController@searchNearby` |
| GET | `/api/v1/marketplace/search/services` | Public | — | `MarketplaceController@serviceSearch` |
| GET | `/api/v1/marketplace/services` | Public | — | `MarketplaceController@serviceSearch` |

## auth {#auth}

| Method | Endpoint | Auth | Permission | Handler |
|--------|----------|------|------------|---------|
| POST | `/api/v1/auth/forgot-password` | Public | — | `PasswordResetController@sendLink` |
| POST | `/api/v1/auth/login` | Public | — | `AuthController@login` |
| POST | `/api/v1/auth/logout` | Bearer | — | `AuthController@logout` |
| POST | `/api/v1/auth/otp/send` | Public | — | `OtpController@send` |
| POST | `/api/v1/auth/otp/verify` | Public | — | `OtpController@verify` |
| GET | `/api/v1/auth/platform/abilities` | Bearer | — | `PlatformAbilitiesController` |
| POST | `/api/v1/auth/register` | Public | — | `AuthController@register` |
| POST | `/api/v1/auth/reset-password` | Public | — | `PasswordResetController@reset` |
| GET | `/api/v1/auth/social/{provider}/callback` | Public | — | `SocialAuthController@callback` |
| GET | `/api/v1/auth/social/{provider}/redirect` | Public | — | `SocialAuthController@redirect` |
| POST | `/api/v1/auth/token` | Public | — | `AuthController@token` |

## account {#account}

| Method | Endpoint | Auth | Permission | Handler |
|--------|----------|------|------------|---------|
| GET | `/api/v1/account/tenants` | Bearer | — | `ClientAccountController@tenants` |

## onboarding {#onboarding}

| Method | Endpoint | Auth | Permission | Handler |
|--------|----------|------|------------|---------|
| GET | `/api/v1/onboarding` | Bearer | — | `OnboardingController@show` |
| GET | `/api/v1/onboarding/service-suggestions` | Bearer | — | `OnboardingController@serviceSuggestions` |
| PATCH | `/api/v1/onboarding/steps/{step}` | Bearer | — | `OnboardingController@updateStep` |
| POST | `/api/v1/onboarding/tenant` | Bearer | — | `OnboardingController@store` |
| POST | `/api/v1/onboarding/upload` | Bearer | — | `MediaUploadController@store` |

## admin {#admin}

| Method | Endpoint | Auth | Permission | Handler |
|--------|----------|------|------------|---------|
| GET | `/api/v1/admin/appointments` | Bearer | office.operations.view|tenants.view | `Admin/AdminAppointmentController@index` |
| GET | `/api/v1/admin/appointments/{uuid}` | Bearer | office.operations.view|tenants.view | `Admin/AdminAppointmentController@show` |
| PATCH | `/api/v1/admin/appointments/{uuid}` | Bearer | office.operations.view|tenants.view | `Admin/AdminAppointmentController@update` |
| GET | `/api/v1/admin/coupons` | Bearer | office.settings.manage|billing.manage | `Admin/CouponAdminController@index` |
| POST | `/api/v1/admin/coupons` | Bearer | office.settings.manage|billing.manage | `Admin/CouponAdminController@store` |
| DELETE | `/api/v1/admin/coupons/{coupon}` | Bearer | office.settings.manage|billing.manage | `Admin/CouponAdminController@destroy` |
| PATCH | `/api/v1/admin/coupons/{coupon}` | Bearer | office.settings.manage|billing.manage | `Admin/CouponAdminController@update` |
| GET | `/api/v1/admin/dashboard` | Bearer | office.dashboard.view|tenants.view | `AdminDashboardController` |
| GET | `/api/v1/admin/domains` | Bearer | office.tenants.view|tenants.view | `Admin/DomainAdminController@index` |
| POST | `/api/v1/admin/domains` | Bearer | office.tenants.view|tenants.view | `Admin/DomainAdminController@store` |
| DELETE | `/api/v1/admin/domains/{domain}` | Bearer | office.tenants.view|tenants.view | `Admin/DomainAdminController@destroy` |
| PATCH | `/api/v1/admin/domains/{domain}` | Bearer | office.tenants.view|tenants.view | `Admin/DomainAdminController@update` |
| GET | `/api/v1/admin/metrics` | Bearer | office.dashboard.view|tenants.view | `PlatformMetricsController` |
| GET | `/api/v1/admin/onboarding` | Bearer | office.tenants.view|tenants.view | `Admin/AdminOnboardingController@index` |
| GET | `/api/v1/admin/overview` | Bearer | office.dashboard.view|tenants.view | `Admin/AdminDashboardController@overview` |
| GET | `/api/v1/admin/payment-gateways/overview` | Bearer | office.settings.manage|billing.manage | `Admin/AdminPaymentGatewaysController@overview` |
| GET | `/api/v1/admin/payment-providers/mtn-momo` | Bearer | office.settings.manage|billing.manage | `Admin/AdminMtnMomoProviderController@show` |
| PATCH | `/api/v1/admin/payment-providers/mtn-momo` | Bearer | office.settings.manage|billing.manage | `Admin/AdminMtnMomoProviderController@update` |
| POST | `/api/v1/admin/payment-providers/mtn-momo/health-check` | Bearer | office.settings.manage|billing.manage | `Admin/AdminMtnMomoProviderController@healthCheck` |
| GET | `/api/v1/admin/payments` | Bearer | office.finance.view|billing.manage | `Admin/BillingAdminController@payments` |
| GET | `/api/v1/admin/payments/failures` | Bearer | office.finance.view|billing.manage | `Admin/BillingAdminController@failures` |
| GET | `/api/v1/admin/plans` | Bearer | office.settings.manage|billing.manage | `Admin/PlanAdminController@index` |
| POST | `/api/v1/admin/plans` | Bearer | office.settings.manage|billing.manage | `Admin/PlanAdminController@store` |
| DELETE | `/api/v1/admin/plans/{plan}` | Bearer | office.settings.manage|billing.manage | `Admin/PlanAdminController@destroy` |
| PATCH | `/api/v1/admin/plans/{plan}` | Bearer | office.settings.manage|billing.manage | `Admin/PlanAdminController@update` |
| GET | `/api/v1/admin/reports` | Bearer | office.operations.view|tenants.view | `Admin/AdminReportsController@index` |
| GET | `/api/v1/admin/signups/unpaid` | Bearer | office.finance.view|billing.manage | `Admin/BillingAdminController@unpaidSignups` |
| GET | `/api/v1/admin/sms` | Bearer | office.settings.manage|billing.manage | `Admin/SmsAdminController@index` |
| GET | `/api/v1/admin/sms-packages` | Bearer | office.settings.manage|billing.manage | `Admin/SmsPackageAdminController@index` |
| POST | `/api/v1/admin/sms-packages` | Bearer | office.settings.manage|billing.manage | `Admin/SmsPackageAdminController@store` |
| DELETE | `/api/v1/admin/sms-packages/{smsPackage}` | Bearer | office.settings.manage|billing.manage | `Admin/SmsPackageAdminController@destroy` |
| PATCH | `/api/v1/admin/sms-packages/{smsPackage}` | Bearer | office.settings.manage|billing.manage | `Admin/SmsPackageAdminController@update` |
| GET | `/api/v1/admin/sms-reseller/overview` | Bearer | office.settings.manage|billing.manage | `Admin/SmsResellerAdminController@overview` |
| GET | `/api/v1/admin/sms-reseller/provider` | Bearer | office.settings.manage|billing.manage | `Admin/SmsResellerAdminController@provider` |
| GET | `/api/v1/admin/sms-reseller/provider/settings` | Bearer | office.settings.manage|billing.manage | `Admin/SmsResellerAdminController@providerSettings` |
| PATCH | `/api/v1/admin/sms-reseller/provider/settings` | Bearer | office.settings.manage|billing.manage | `Admin/SmsResellerAdminController@updateProviderSettings` |
| POST | `/api/v1/admin/sms-reseller/provider/sync` | Bearer | office.settings.manage|billing.manage | `Admin/SmsResellerAdminController@syncProvider` |
| GET | `/api/v1/admin/sms-reseller/provider/sync-logs` | Bearer | office.settings.manage|billing.manage | `Admin/SmsResellerAdminController@syncLogs` |
| POST | `/api/v1/admin/sms-reseller/provider/test` | Bearer | office.settings.manage|billing.manage | `Admin/SmsResellerAdminController@testProvider` |
| POST | `/api/v1/admin/sms-reseller/provider/test-sms` | Bearer | office.settings.manage|billing.manage | `Admin/SmsResellerAdminController@testSms` |
| GET | `/api/v1/admin/sms-reseller/purchases` | Bearer | office.settings.manage|billing.manage | `Admin/SmsResellerAdminController@purchases` |
| GET | `/api/v1/admin/sms-reseller/transactions` | Bearer | office.settings.manage|billing.manage | `Admin/SmsResellerAdminController@transactions` |
| GET | `/api/v1/admin/sms-reseller/wallets` | Bearer | office.settings.manage|billing.manage | `Admin/SmsResellerAdminController@wallets` |
| GET | `/api/v1/admin/subscriptions` | Bearer | office.finance.view|billing.manage | `Admin/SubscriptionAdminController@index` |
| GET | `/api/v1/admin/support/tickets` | Bearer | office.support.view|tenants.view | `Admin/SupportAdminController@index` |
| GET | `/api/v1/admin/tenant-wallets` | Bearer | office.finance.view|billing.manage | `Admin/AdminTenantWalletController@index` |
| GET | `/api/v1/admin/tenants` | Bearer | office.tenants.view|tenants.view | `Admin/TenantController@index` |
| POST | `/api/v1/admin/tenants` | Bearer | office.tenants.view|tenants.view | `Admin/TenantController@store` |
| DELETE | `/api/v1/admin/tenants/{tenant}` | Bearer | office.tenants.view|tenants.view | `Admin/TenantController@destroy` |
| GET | `/api/v1/admin/tenants/{tenant}` | Bearer | office.tenants.view|tenants.view | `Admin/TenantController@show` |
| PATCH | `/api/v1/admin/tenants/{tenant}` | Bearer | office.tenants.view|tenants.view | `Admin/TenantController@update` |
| POST | `/api/v1/admin/tenants/{tenant}/wallet/adjust` | Bearer | office.finance.view|billing.manage | `Admin/AdminTenantWalletController@adjust` |
| GET | `/api/v1/admin/users` | Bearer | office.tenants.view|tenants.view | `Admin/UserAdminController@index` |
| DELETE | `/api/v1/admin/users/{user}` | Bearer | office.tenants.view|tenants.view | `Admin/UserAdminController@destroy` |
| GET | `/api/v1/admin/users/{user}` | Bearer | office.tenants.view|tenants.view | `Admin/UserAdminController@show` |
| PATCH | `/api/v1/admin/users/{user}` | Bearer | office.tenants.view|tenants.view | `Admin/UserAdminController@update` |
| POST | `/api/v1/admin/users/{user}/password-reset-link` | Bearer | office.tenants.view|tenants.view | `Admin/UserPasswordController@sendResetLink` |
| POST | `/api/v1/admin/users/{user}/reset-password` | Bearer | office.tenants.view|tenants.view | `Admin/UserPasswordController@resetAndNotify` |

## booking {#booking}

| Method | Endpoint | Auth | Permission | Handler |
|--------|----------|------|------------|---------|
| POST | `/api/v1/booking/appointments` | Public (tenant host/slug) | — | `AppointmentController@store` |
| POST | `/api/v1/booking/appointments/{uuid}/payments/checkout` | Public (tenant host/slug) | — | `BookingPaymentController@checkout` |
| GET | `/api/v1/booking/availability` | Public (tenant host/slug) | — | `BookingAvailabilityController` |
| GET | `/api/v1/booking/context` | Public (tenant host/slug) | — | `TenantContextController` |
| POST | `/api/v1/booking/coupons/validate` | Public (tenant host/slug) | — | `BookingCouponController@validate` |
| GET | `/api/v1/booking/locations` | Public (tenant host/slug) | — | `BookingCatalogController@locations` |
| POST | `/api/v1/booking/otp/send` | Public (tenant host/slug) | — | `OtpController@send` |
| POST | `/api/v1/booking/otp/verify` | Public (tenant host/slug) | — | `OtpController@verify` |
| GET | `/api/v1/booking/payments/verify` | Public (tenant host/slug) | — | `BookingPaymentController@verify` |
| GET | `/api/v1/booking/services` | Public (tenant host/slug) | — | `BookingCatalogController@services` |
| GET | `/api/v1/booking/staff` | Public (tenant host/slug) | — | `BookingCatalogController@staff` |
| POST | `/api/v1/booking/waitlist` | Public (tenant host/slug) | — | `BookingWaitlistController@store` |

## webhooks {#webhooks}

| Method | Endpoint | Auth | Permission | Handler |
|--------|----------|------|------------|---------|
| POST | `/api/v1/webhooks/flutterwave` | Public | — | `PaymentWebhookController@flutterwave` |
| POST | `/api/v1/webhooks/mtn-momo` | Public | — | `MtnMomoWebhookController@callback` |
| POST | `/api/v1/webhooks/paystack` | Public | — | `PaymentWebhookController@paystack` |

## integrations {#integrations}

| Method | Endpoint | Auth | Permission | Handler |
|--------|----------|------|------------|---------|
| GET | `/api/v1/integrations/wordpress/health` | Public | — | `Closure` |

## me {#me}

| Method | Endpoint | Auth | Permission | Handler |
|--------|----------|------|------------|---------|
| GET | `/api/v1/me` | Bearer | — | `AuthController@me` |

## Tenant › account {#tenant-account}

| Method | Endpoint | Auth | Permission | Handler |
|--------|----------|------|------------|---------|
| GET | `/api/v1/{tenantSlug}/account/bookings` | Bearer + Tenant | bookings.view | `ClientAccountController@bookingHistory` |
| GET | `/api/v1/{tenantSlug}/account/bookings/{uuid}` | Bearer + Tenant | bookings.view | `ClientAccountController@showBooking` |
| PATCH | `/api/v1/{tenantSlug}/account/bookings/{uuid}` | Bearer + Tenant | bookings.create | `ClientAccountController@updateBooking` |
| GET | `/api/v1/{tenantSlug}/account/discovery` | Bearer + Tenant | — | `ClientAccountController@discovery` |
| GET | `/api/v1/{tenantSlug}/account/discovery/favorites` | Bearer + Tenant | — | `ClientDiscoveryController@favorites` |
| POST | `/api/v1/{tenantSlug}/account/discovery/favorites` | Bearer + Tenant | — | `ClientDiscoveryController@addFavorite` |
| DELETE | `/api/v1/{tenantSlug}/account/discovery/favorites/{businessSlug}` | Bearer + Tenant | — | `ClientDiscoveryController@removeFavorite` |
| GET | `/api/v1/{tenantSlug}/account/discovery/recently-viewed` | Bearer + Tenant | — | `ClientDiscoveryController@recentlyViewed` |
| POST | `/api/v1/{tenantSlug}/account/discovery/recently-viewed` | Bearer + Tenant | — | `ClientDiscoveryController@markViewed` |
| GET | `/api/v1/{tenantSlug}/account/favorites` | Bearer + Tenant | — | `ClientAccountController@favorites` |
| POST | `/api/v1/{tenantSlug}/account/favorites` | Bearer + Tenant | — | `ClientAccountController@storeFavorite` |
| DELETE | `/api/v1/{tenantSlug}/account/favorites/{type}/{id}` | Bearer + Tenant | — | `ClientAccountController@destroyFavorite` |
| GET | `/api/v1/{tenantSlug}/account/loyalty` | Bearer + Tenant | — | `ClientAccountController@loyalty` |
| PATCH | `/api/v1/{tenantSlug}/account/profile` | Bearer + Tenant | — | `ClientAccountController@updateProfile` |

## Tenant › analytics {#tenant-analytics}

| Method | Endpoint | Auth | Permission | Handler |
|--------|----------|------|------------|---------|
| GET | `/api/v1/{tenantSlug}/analytics/branch-comparison` | Bearer + Tenant | analytics.view | `WorkspaceDashboardController@branchComparison` |
| GET | `/api/v1/{tenantSlug}/analytics/insights` | Bearer + Tenant | reports.view | `AnalyticsInsightsController` |
| GET | `/api/v1/{tenantSlug}/analytics/occupancy` | Bearer + Tenant | reports.view | `AnalyticsInsightsController@occupancy` |
| GET | `/api/v1/{tenantSlug}/analytics/retention` | Bearer + Tenant | reports.view | `AnalyticsInsightsController@retention` |

## Tenant › appointments {#tenant-appointments}

| Method | Endpoint | Auth | Permission | Handler |
|--------|----------|------|------------|---------|
| GET | `/api/v1/{tenantSlug}/appointments` | Bearer + Tenant | bookings.view | `AppointmentController@index` |
| POST | `/api/v1/{tenantSlug}/appointments` | Bearer + Tenant | bookings.create | `AppointmentController@store` |
| GET | `/api/v1/{tenantSlug}/appointments/{uuid}` | Bearer + Tenant | bookings.view | `AppointmentController@show` |
| PATCH | `/api/v1/{tenantSlug}/appointments/{uuid}` | Bearer + Tenant | bookings.update | `AppointmentController@update` |

## Tenant › approvals {#tenant-approvals}

| Method | Endpoint | Auth | Permission | Handler |
|--------|----------|------|------------|---------|
| GET | `/api/v1/{tenantSlug}/approvals` | Bearer + Tenant | approvals.view | `WorkspaceDashboardController@approvals` |
| POST | `/api/v1/{tenantSlug}/approvals` | Bearer + Tenant | approvals.create | `ApprovalRequestController@store` |
| GET | `/api/v1/{tenantSlug}/approvals/inbox` | Bearer + Tenant | approvals.view | `ApprovalRequestController@inbox` |
| POST | `/api/v1/{tenantSlug}/approvals/{approvalRequest}/approve` | Bearer + Tenant | approvals.update | `ApprovalRequestController@approve` |
| POST | `/api/v1/{tenantSlug}/approvals/{approvalRequest}/reject` | Bearer + Tenant | approvals.update | `ApprovalRequestController@reject` |

## Tenant › auth {#tenant-auth}

| Method | Endpoint | Auth | Permission | Handler |
|--------|----------|------|------------|---------|
| GET | `/api/v1/{tenantSlug}/auth/abilities` | Bearer + Tenant | — | `TenantAbilitiesController` |

## Tenant › book {#tenant-book}

| Method | Endpoint | Auth | Permission | Handler |
|--------|----------|------|------------|---------|
| POST | `/api/v1/{tenantSlug}/book/appointments` | Public (tenant host/slug) | — | `AppointmentController@store` |
| POST | `/api/v1/{tenantSlug}/book/appointments/{uuid}/payments/checkout` | Public (tenant host/slug) | — | `BookingPaymentController@checkout` |
| GET | `/api/v1/{tenantSlug}/book/availability` | Public (tenant host/slug) | — | `BookingAvailabilityController` |
| POST | `/api/v1/{tenantSlug}/book/coupons/validate` | Public (tenant host/slug) | — | `BookingCouponController@validate` |
| GET | `/api/v1/{tenantSlug}/book/locations` | Public (tenant host/slug) | — | `BookingCatalogController@locations` |
| POST | `/api/v1/{tenantSlug}/book/otp/send` | Public (tenant host/slug) | — | `OtpController@send` |
| POST | `/api/v1/{tenantSlug}/book/otp/verify` | Public (tenant host/slug) | — | `OtpController@verify` |
| GET | `/api/v1/{tenantSlug}/book/payments/verify` | Public (tenant host/slug) | — | `BookingPaymentController@verify` |
| GET | `/api/v1/{tenantSlug}/book/services` | Public (tenant host/slug) | — | `BookingCatalogController@services` |
| GET | `/api/v1/{tenantSlug}/book/staff` | Public (tenant host/slug) | — | `BookingCatalogController@staff` |
| POST | `/api/v1/{tenantSlug}/book/waitlist` | Public (tenant host/slug) | — | `BookingWaitlistController@store` |

## Tenant › booking-attribution {#tenant-booking-attribution}

| Method | Endpoint | Auth | Permission | Handler |
|--------|----------|------|------------|---------|
| POST | `/api/v1/{tenantSlug}/booking-attribution` | Public (tenant host/slug) | — | `SocialBookingLinkController@storeAttribution` |

## Tenant › branches {#tenant-branches}

| Method | Endpoint | Auth | Permission | Handler |
|--------|----------|------|------------|---------|
| GET | `/api/v1/{tenantSlug}/branches/groups` | Bearer + Tenant | settings.manage | `WorkspaceDashboardController@branchGroups` |

## Tenant › bundles {#tenant-bundles}

| Method | Endpoint | Auth | Permission | Handler |
|--------|----------|------|------------|---------|
| GET | `/api/v1/{tenantSlug}/bundles` | Bearer + Tenant | inventory.view|pos.view | `ProductBundleController@index` |
| POST | `/api/v1/{tenantSlug}/bundles` | Bearer + Tenant | inventory.create | `ProductBundleController@store` |
| DELETE | `/api/v1/{tenantSlug}/bundles/{productBundle}` | Bearer + Tenant | inventory.delete | `ProductBundleController@destroy` |
| GET | `/api/v1/{tenantSlug}/bundles/{productBundle}` | Bearer + Tenant | inventory.view|pos.view | `ProductBundleController@show` |
| PATCH | `/api/v1/{tenantSlug}/bundles/{productBundle}` | Bearer + Tenant | inventory.update | `ProductBundleController@update` |
| GET | `/api/v1/{tenantSlug}/bundles/{productBundle}/pos` | Bearer + Tenant | inventory.view|pos.view | `ProductBundleController@pos` |

## Tenant › chair-rentals {#tenant-chair-rentals}

| Method | Endpoint | Auth | Permission | Handler |
|--------|----------|------|------------|---------|
| GET | `/api/v1/{tenantSlug}/chair-rentals` | Bearer + Tenant | staff.view | `WorkspaceDashboardController@chairRentals` |
| GET | `/api/v1/{tenantSlug}/chair-rentals/sessions` | Bearer + Tenant | staff.view | `ChairRentalController@index` |
| DELETE | `/api/v1/{tenantSlug}/chair-rentals/{chairRentalProfile}` | Bearer + Tenant | staff.update | `ChairRentalController@destroy` |

## Tenant › checkout-sessions {#tenant-checkout-sessions}

| Method | Endpoint | Auth | Permission | Handler |
|--------|----------|------|------------|---------|
| POST | `/api/v1/{tenantSlug}/checkout-sessions` | Bearer + Tenant | pos.create | `CheckoutSessionController@store` |
| GET | `/api/v1/{tenantSlug}/checkout-sessions/{checkoutSession}` | Bearer + Tenant | pos.view | `CheckoutSessionController@show` |
| PATCH | `/api/v1/{tenantSlug}/checkout-sessions/{checkoutSession}` | Bearer + Tenant | pos.create | `CheckoutSessionController@update` |
| POST | `/api/v1/{tenantSlug}/checkout-sessions/{checkoutSession}/complete` | Bearer + Tenant | pos.create | `CheckoutSessionController@complete` |

## Tenant › client-memberships {#tenant-client-memberships}

| Method | Endpoint | Auth | Permission | Handler |
|--------|----------|------|------------|---------|
| GET | `/api/v1/{tenantSlug}/client-memberships` | Bearer + Tenant | memberships.view | `MembershipController@memberships` |
| POST | `/api/v1/{tenantSlug}/client-memberships` | Bearer + Tenant | memberships.create | `MembershipController@assign` |

## Tenant › client-packages {#tenant-client-packages}

| Method | Endpoint | Auth | Permission | Handler |
|--------|----------|------|------------|---------|
| GET | `/api/v1/{tenantSlug}/client-packages` | Bearer + Tenant | packages.view | `ServicePackageController@balances` |
| POST | `/api/v1/{tenantSlug}/client-packages/sell` | Bearer + Tenant | packages.create | `ServicePackageController@sell` |

## Tenant › clients {#tenant-clients}

| Method | Endpoint | Auth | Permission | Handler |
|--------|----------|------|------------|---------|
| GET | `/api/v1/{tenantSlug}/clients` | Bearer + Tenant | clients.view | `ClientController@index` |
| POST | `/api/v1/{tenantSlug}/clients` | Bearer + Tenant | clients.create | `ClientController@store` |
| DELETE | `/api/v1/{tenantSlug}/clients/{client}` | Bearer + Tenant | clients.delete | `ClientController@destroy` |
| PATCH | `/api/v1/{tenantSlug}/clients/{client}` | Bearer + Tenant | clients.update | `ClientController@update` |
| POST | `/api/v1/{tenantSlug}/clients/{client}/allergies` | Bearer + Tenant | clients.update | `ClientProfileController@storeAllergy` |
| DELETE | `/api/v1/{tenantSlug}/clients/{client}/allergies/{allergy}` | Bearer + Tenant | clients.update | `ClientProfileController@destroyAllergy` |
| POST | `/api/v1/{tenantSlug}/clients/{client}/documents` | Bearer + Tenant | clients.update | `ClientProfileController@storeDocument` |
| DELETE | `/api/v1/{tenantSlug}/clients/{client}/documents/{document}` | Bearer + Tenant | clients.update | `ClientProfileController@destroyDocument` |
| POST | `/api/v1/{tenantSlug}/clients/{client}/media` | Bearer + Tenant | clients.update | `ClientProfileController@storeMedia` |
| DELETE | `/api/v1/{tenantSlug}/clients/{client}/media/{medium}` | Bearer + Tenant | clients.update | `ClientProfileController@destroyMedia` |
| POST | `/api/v1/{tenantSlug}/clients/{client}/notes` | Bearer + Tenant | clients.update | `ClientProfileController@storeNote` |
| DELETE | `/api/v1/{tenantSlug}/clients/{client}/notes/{note}` | Bearer + Tenant | clients.update | `ClientProfileController@destroyNote` |
| POST | `/api/v1/{tenantSlug}/clients/{client}/patch-tests` | Bearer + Tenant | clients.update | `ClientProfileController@storePatchTest` |
| DELETE | `/api/v1/{tenantSlug}/clients/{client}/patch-tests/{patchTest}` | Bearer + Tenant | clients.update | `ClientProfileController@destroyPatchTest` |
| GET | `/api/v1/{tenantSlug}/clients/{client}/profile` | Bearer + Tenant | clients.view | `ClientProfileController@show` |
| PATCH | `/api/v1/{tenantSlug}/clients/{client}/profile` | Bearer + Tenant | clients.update | `ClientProfileController@update` |
| POST | `/api/v1/{tenantSlug}/clients/{client}/treatments` | Bearer + Tenant | clients.update | `ClientProfileController@storeTreatment` |
| DELETE | `/api/v1/{tenantSlug}/clients/{client}/treatments/{treatment}` | Bearer + Tenant | clients.update | `ClientProfileController@destroyTreatment` |

## Tenant › complaint-cases {#tenant-complaint-cases}

| Method | Endpoint | Auth | Permission | Handler |
|--------|----------|------|------------|---------|
| GET | `/api/v1/{tenantSlug}/complaint-cases` | Bearer + Tenant | reviews.view | `ReviewController@complaintCases` |

## Tenant › context {#tenant-context}

| Method | Endpoint | Auth | Permission | Handler |
|--------|----------|------|------------|---------|
| GET | `/api/v1/{tenantSlug}/context` | Public (tenant host/slug) | — | `TenantContextController` |

## Tenant › coupons {#tenant-coupons}

| Method | Endpoint | Auth | Permission | Handler |
|--------|----------|------|------------|---------|
| GET | `/api/v1/{tenantSlug}/coupons` | Bearer + Tenant | settings.manage | `TenantCouponController@index` |
| POST | `/api/v1/{tenantSlug}/coupons` | Bearer + Tenant | settings.manage | `TenantCouponController@store` |
| DELETE | `/api/v1/{tenantSlug}/coupons/{coupon}` | Bearer + Tenant | settings.manage | `TenantCouponController@destroy` |
| PATCH | `/api/v1/{tenantSlug}/coupons/{coupon}` | Bearer + Tenant | settings.manage | `TenantCouponController@update` |

## Tenant › dashboard {#tenant-dashboard}

| Method | Endpoint | Auth | Permission | Handler |
|--------|----------|------|------------|---------|
| GET | `/api/v1/{tenantSlug}/dashboard/bookings-breakdown` | Bearer + Tenant | analytics.view | `DashboardController@bookingsBreakdown` |
| GET | `/api/v1/{tenantSlug}/dashboard/growth-chart` | Bearer + Tenant | analytics.view | `DashboardController@growthChart` |
| GET | `/api/v1/{tenantSlug}/dashboard/recent` | Bearer + Tenant | analytics.view | `DashboardController@recentAppointments` |
| GET | `/api/v1/{tenantSlug}/dashboard/revenue-chart` | Bearer + Tenant | analytics.view | `DashboardController@revenueChart` |
| GET | `/api/v1/{tenantSlug}/dashboard/stats` | Bearer + Tenant | analytics.view | `DashboardController@stats` |
| GET | `/api/v1/{tenantSlug}/dashboard/upcoming` | Bearer + Tenant | analytics.view | `DashboardController@upcomingAppointments` |

## Tenant › enterprise {#tenant-enterprise}

| Method | Endpoint | Auth | Permission | Handler |
|--------|----------|------|------------|---------|
| GET | `/api/v1/{tenantSlug}/enterprise/approvals` | Bearer + Tenant | approvals.view | `WorkspaceDashboardController@approvals` |
| POST | `/api/v1/{tenantSlug}/enterprise/approvals/{approvalRequest}` | Bearer + Tenant | approvals.update | `WorkspaceDashboardController@resolveApproval` |
| GET | `/api/v1/{tenantSlug}/enterprise/chair-rentals` | Bearer + Tenant | staff.view | `WorkspaceDashboardController@chairRentals` |
| GET | `/api/v1/{tenantSlug}/enterprise/white-label-preview` | Bearer + Tenant | settings.manage | `WorkspaceDashboardController@whiteLabelPreview` |

## Tenant › finance {#tenant-finance}

| Method | Endpoint | Auth | Permission | Handler |
|--------|----------|------|------------|---------|
| GET | `/api/v1/{tenantSlug}/finance/adjustments` | Bearer + Tenant | finance.view | `FinanceAdjustmentController@index` |
| POST | `/api/v1/{tenantSlug}/finance/adjustments` | Bearer + Tenant | finance.view | `FinanceAdjustmentController@store` |
| GET | `/api/v1/{tenantSlug}/finance/cash-drawer/active` | Bearer + Tenant | finance.view | `FinanceCashDrawerController@active` |
| POST | `/api/v1/{tenantSlug}/finance/cash-drawer/open` | Bearer + Tenant | pos.create | `FinanceCashDrawerController@open` |
| GET | `/api/v1/{tenantSlug}/finance/cash-drawer/sessions` | Bearer + Tenant | finance.view | `FinanceCashDrawerController@index` |
| GET | `/api/v1/{tenantSlug}/finance/cash-drawer/sessions/{cashDrawerSession}` | Bearer + Tenant | finance.view | `FinanceCashDrawerController@show` |
| POST | `/api/v1/{tenantSlug}/finance/cash-drawer/sessions/{cashDrawerSession}/close` | Bearer + Tenant | pos.create | `FinanceCashDrawerController@close` |
| GET | `/api/v1/{tenantSlug}/finance/discount-policy` | Bearer + Tenant | pos.create | `FinanceDiscountPolicyController@show` |
| GET | `/api/v1/{tenantSlug}/finance/expenses` | Bearer + Tenant | finance.view | `FinanceExpenseController@index` |
| POST | `/api/v1/{tenantSlug}/finance/expenses` | Bearer + Tenant | finance.view | `FinanceExpenseController@store` |
| GET | `/api/v1/{tenantSlug}/finance/expenses/categories` | Bearer + Tenant | finance.view | `FinanceExpenseController@categories` |
| GET | `/api/v1/{tenantSlug}/finance/expenses/{expense}` | Bearer + Tenant | finance.view | `FinanceExpenseController@show` |
| POST | `/api/v1/{tenantSlug}/finance/expenses/{expense}/void` | Bearer + Tenant | finance.view | `FinanceExpenseController@void` |
| GET | `/api/v1/{tenantSlug}/finance/insights` | Bearer + Tenant | finance.view | `FinanceInsightsController@show` |
| GET | `/api/v1/{tenantSlug}/finance/invoices` | Bearer + Tenant | finance.view | `FinanceInvoiceController@index` |
| POST | `/api/v1/{tenantSlug}/finance/invoices` | Bearer + Tenant | finance.view | `FinanceInvoiceController@store` |
| POST | `/api/v1/{tenantSlug}/finance/invoices/from-booking/{bookingId}` | Bearer + Tenant | finance.view | `FinanceInvoiceController@fromBooking` |
| POST | `/api/v1/{tenantSlug}/finance/invoices/from-pos/{saleId}` | Bearer + Tenant | finance.view | `FinanceInvoiceController@fromPosSale` |
| GET | `/api/v1/{tenantSlug}/finance/invoices/{invoice}` | Bearer + Tenant | finance.view | `FinanceInvoiceController@show` |
| PATCH | `/api/v1/{tenantSlug}/finance/invoices/{invoice}` | Bearer + Tenant | finance.view | `FinanceInvoiceController@update` |
| POST | `/api/v1/{tenantSlug}/finance/invoices/{invoice}/cancel` | Bearer + Tenant | finance.view | `FinanceInvoiceController@cancel` |
| POST | `/api/v1/{tenantSlug}/finance/invoices/{invoice}/payments` | Bearer + Tenant | finance.view | `FinanceInvoiceController@recordPayment` |
| GET | `/api/v1/{tenantSlug}/finance/invoices/{invoice}/receipt` | Bearer + Tenant | finance.view | `FinanceInvoiceController@receipt` |
| POST | `/api/v1/{tenantSlug}/finance/invoices/{invoice}/send` | Bearer + Tenant | finance.view | `FinanceInvoiceController@send` |
| GET | `/api/v1/{tenantSlug}/finance/overview` | Bearer + Tenant | finance.view | `FinanceOverviewController@show` |
| GET | `/api/v1/{tenantSlug}/finance/payroll` | Bearer + Tenant | — | `FinancePayrollController@index` |
| GET | `/api/v1/{tenantSlug}/finance/payroll/export` | Bearer + Tenant | — | `FinancePayrollController@export` |
| GET | `/api/v1/{tenantSlug}/finance/prepaid-balances` | Bearer + Tenant | finance.view | `FinancePrepaidBalanceController@show` |
| GET | `/api/v1/{tenantSlug}/finance/prepaid-balances/export` | Bearer + Tenant | finance.view | `FinancePrepaidBalanceController@export` |
| GET | `/api/v1/{tenantSlug}/finance/prepaid-balances/lookup` | Bearer + Tenant | finance.view | `FinancePrepaidBalanceController@lookup` |
| GET | `/api/v1/{tenantSlug}/finance/profit-loss` | Bearer + Tenant | finance.view | `FinanceProfitLossController@show` |
| GET | `/api/v1/{tenantSlug}/finance/profit-loss/export` | Bearer + Tenant | finance.view | `FinanceProfitLossController@export` |
| GET | `/api/v1/{tenantSlug}/finance/refunds` | Bearer + Tenant | finance.view | `FinanceRefundController@index` |
| POST | `/api/v1/{tenantSlug}/finance/refunds` | Bearer + Tenant | finance.view | `FinanceRefundController@store` |
| GET | `/api/v1/{tenantSlug}/finance/refunds/preview` | Bearer + Tenant | finance.view | `FinanceRefundController@preview` |
| GET | `/api/v1/{tenantSlug}/finance/refunds/{refund}` | Bearer + Tenant | finance.view | `FinanceRefundController@show` |
| GET | `/api/v1/{tenantSlug}/finance/tax-rates` | Bearer + Tenant | finance.view | `FinanceTaxController@rates` |
| POST | `/api/v1/{tenantSlug}/finance/tax-rates` | Bearer + Tenant | finance.view | `FinanceTaxController@storeRate` |
| POST | `/api/v1/{tenantSlug}/finance/tax-rates/preview` | Bearer + Tenant | pos.create | `FinanceTaxController@preview` |
| PATCH | `/api/v1/{tenantSlug}/finance/tax-rates/{taxRate}` | Bearer + Tenant | finance.view | `FinanceTaxController@updateRate` |
| GET | `/api/v1/{tenantSlug}/finance/taxes/report` | Bearer + Tenant | finance.view | `FinanceTaxController@report` |
| GET | `/api/v1/{tenantSlug}/finance/taxes/report/export` | Bearer + Tenant | finance.view | `FinanceTaxController@exportReport` |
| GET | `/api/v1/{tenantSlug}/finance/tips` | Bearer + Tenant | finance.view | `FinanceTipsController@index` |
| GET | `/api/v1/{tenantSlug}/finance/transactions` | Bearer + Tenant | finance.view | `FinanceTransactionsController@index` |
| GET | `/api/v1/{tenantSlug}/finance/transactions/export` | Bearer + Tenant | finance.view | `FinanceTransactionsController@export` |

## Tenant › form-submissions {#tenant-form-submissions}

| Method | Endpoint | Auth | Permission | Handler |
|--------|----------|------|------------|---------|
| GET | `/api/v1/{tenantSlug}/form-submissions` | Bearer + Tenant | forms.view | `FormSubmissionController@index` |
| GET | `/api/v1/{tenantSlug}/form-submissions/{formSubmission}` | Bearer + Tenant | forms.view | `FormSubmissionController@show` |

## Tenant › forms {#tenant-forms}

| Method | Endpoint | Auth | Permission | Handler |
|--------|----------|------|------------|---------|
| GET | `/api/v1/{tenantSlug}/forms` | Bearer + Tenant | forms.view | `FormTemplateController@index` |
| POST | `/api/v1/{tenantSlug}/forms` | Bearer + Tenant | forms.create | `FormTemplateController@store` |
| GET | `/api/v1/{tenantSlug}/forms/library` | Bearer + Tenant | forms.view | `FormTemplateController@library` |
| POST | `/api/v1/{tenantSlug}/forms/library/import` | Bearer + Tenant | forms.create | `FormTemplateController@importLibrary` |
| DELETE | `/api/v1/{tenantSlug}/forms/{formTemplate}` | Bearer + Tenant | forms.delete | `FormTemplateController@destroy` |
| GET | `/api/v1/{tenantSlug}/forms/{formTemplate}` | Bearer + Tenant | forms.view | `FormTemplateController@show` |
| PATCH | `/api/v1/{tenantSlug}/forms/{formTemplate}` | Bearer + Tenant | forms.update | `FormTemplateController@update` |
| POST | `/api/v1/{tenantSlug}/forms/{formTemplate}/submissions` | Bearer + Tenant | forms.create | `FormSubmissionController@store` |

## Tenant › gift-cards {#tenant-gift-cards}

| Method | Endpoint | Auth | Permission | Handler |
|--------|----------|------|------------|---------|
| GET | `/api/v1/{tenantSlug}/gift-cards` | Bearer + Tenant | gift_cards.view | `GiftCardController@index` |
| POST | `/api/v1/{tenantSlug}/gift-cards` | Bearer + Tenant | gift_cards.create | `GiftCardController@sell` |
| GET | `/api/v1/{tenantSlug}/gift-cards/code/{code}` | Bearer + Tenant | gift_cards.view | `GiftCardController@showByCode` |
| GET | `/api/v1/{tenantSlug}/gift-cards/liability` | Bearer + Tenant | gift_cards.view | `GiftCardController@liabilitySummary` |
| GET | `/api/v1/{tenantSlug}/gift-cards/liability-summary` | Bearer + Tenant | gift_cards.view | `GiftCardController@liabilitySummary` |
| GET | `/api/v1/{tenantSlug}/gift-cards/lookup` | Bearer + Tenant | gift_cards.view | `GiftCardController@lookupQuery` |
| POST | `/api/v1/{tenantSlug}/gift-cards/sell` | Bearer + Tenant | gift_cards.create | `GiftCardController@sell` |
| POST | `/api/v1/{tenantSlug}/gift-cards/{giftCard}/adjust` | Bearer + Tenant | gift_cards.update | `GiftCardController@adjust` |
| POST | `/api/v1/{tenantSlug}/gift-cards/{giftCard}/redeem` | Bearer + Tenant | gift_cards.update | `GiftCardController@redeem` |

## Tenant › inventory {#tenant-inventory}

| Method | Endpoint | Auth | Permission | Handler |
|--------|----------|------|------------|---------|
| GET | `/api/v1/{tenantSlug}/inventory/dashboard` | Bearer + Tenant | inventory.view|pos.view | `InventoryDashboardController@show` |

## Tenant › kpi-targets {#tenant-kpi-targets}

| Method | Endpoint | Auth | Permission | Handler |
|--------|----------|------|------------|---------|
| GET | `/api/v1/{tenantSlug}/kpi-targets` | Bearer + Tenant | reports.view | `KpiController@dashboard` |
| POST | `/api/v1/{tenantSlug}/kpi-targets` | Bearer + Tenant | reports.create | `KpiController@store` |
| DELETE | `/api/v1/{tenantSlug}/kpi-targets/{kpiTarget}` | Bearer + Tenant | reports.delete | `KpiController@destroy` |
| PATCH | `/api/v1/{tenantSlug}/kpi-targets/{kpiTarget}` | Bearer + Tenant | reports.update | `KpiController@update` |

## Tenant › kpis {#tenant-kpis}

| Method | Endpoint | Auth | Permission | Handler |
|--------|----------|------|------------|---------|
| GET | `/api/v1/{tenantSlug}/kpis` | Bearer + Tenant | reports.view | `KpiController@index` |
| POST | `/api/v1/{tenantSlug}/kpis` | Bearer + Tenant | reports.create | `KpiController@store` |
| DELETE | `/api/v1/{tenantSlug}/kpis/{kpiTarget}` | Bearer + Tenant | reports.delete | `KpiController@destroy` |
| GET | `/api/v1/{tenantSlug}/kpis/{kpiTarget}` | Bearer + Tenant | reports.view | `KpiController@show` |
| PATCH | `/api/v1/{tenantSlug}/kpis/{kpiTarget}` | Bearer + Tenant | reports.update | `KpiController@update` |

## Tenant › locations {#tenant-locations}

| Method | Endpoint | Auth | Permission | Handler |
|--------|----------|------|------------|---------|
| GET | `/api/v1/{tenantSlug}/locations` | Bearer + Tenant | services.view|settings.manage|inventory.view|pos.view | `LocationController@index` |
| POST | `/api/v1/{tenantSlug}/locations` | Bearer + Tenant | settings.manage | `LocationController@store` |
| DELETE | `/api/v1/{tenantSlug}/locations/{location}` | Bearer + Tenant | settings.manage | `LocationController@destroy` |
| PATCH | `/api/v1/{tenantSlug}/locations/{location}` | Bearer + Tenant | settings.manage | `LocationController@update` |

## Tenant › marketing {#tenant-marketing}

| Method | Endpoint | Auth | Permission | Handler |
|--------|----------|------|------------|---------|
| GET | `/api/v1/{tenantSlug}/marketing/abandoned-bookings` | Bearer + Tenant | marketing.view | `WorkspaceDashboardController@abandonedBookings` |
| POST | `/api/v1/{tenantSlug}/marketing/abandoned-bookings` | Bearer + Tenant | marketing.create | `AbandonedBookingController@store` |
| GET | `/api/v1/{tenantSlug}/marketing/abandoned-bookings/analytics` | Bearer + Tenant | marketing.view | `AbandonedBookingController@analytics` |
| GET | `/api/v1/{tenantSlug}/marketing/abandoned-bookings/sessions` | Bearer + Tenant | marketing.view | `AbandonedBookingController@index` |
| DELETE | `/api/v1/{tenantSlug}/marketing/abandoned-bookings/{abandonedBookingSession}` | Bearer + Tenant | marketing.delete | `AbandonedBookingController@destroy` |
| PATCH | `/api/v1/{tenantSlug}/marketing/abandoned-bookings/{abandonedBookingSession}` | Bearer + Tenant | marketing.update | `AbandonedBookingController@update` |
| POST | `/api/v1/{tenantSlug}/marketing/abandoned-bookings/{abandonedBookingSession}/send-reminder` | Bearer + Tenant | marketing.update | `AbandonedBookingController@sendReminder` |
| POST | `/api/v1/{tenantSlug}/marketing/booking-attributions` | Bearer + Tenant | marketing.create | `SocialBookingLinkController@storeAttribution` |
| GET | `/api/v1/{tenantSlug}/marketing/events` | Bearer + Tenant | marketing.view | `MarketingIntegrationController@events` |
| POST | `/api/v1/{tenantSlug}/marketing/events` | Bearer + Tenant | marketing.create | `MarketingIntegrationController@storeEvent` |
| GET | `/api/v1/{tenantSlug}/marketing/integrations` | Bearer + Tenant | marketing.view | `MarketingIntegrationController@index` |
| PATCH | `/api/v1/{tenantSlug}/marketing/integrations/{provider}` | Bearer + Tenant | marketing.update | `MarketingIntegrationController@update` |
| GET | `/api/v1/{tenantSlug}/marketing/rebooking` | Bearer + Tenant | marketing.view | `WorkspaceDashboardController@rebooking` |
| GET | `/api/v1/{tenantSlug}/marketing/rebooking-rules` | Bearer + Tenant | marketing.view | `RebookingRuleController@index` |
| POST | `/api/v1/{tenantSlug}/marketing/rebooking-rules` | Bearer + Tenant | marketing.create | `RebookingRuleController@store` |
| GET | `/api/v1/{tenantSlug}/marketing/rebooking-rules/suggestions` | Bearer + Tenant | marketing.view | `RebookingRuleController@suggestions` |
| DELETE | `/api/v1/{tenantSlug}/marketing/rebooking-rules/{rebookingRule}` | Bearer + Tenant | marketing.delete | `RebookingRuleController@destroy` |
| PATCH | `/api/v1/{tenantSlug}/marketing/rebooking-rules/{rebookingRule}` | Bearer + Tenant | marketing.update | `RebookingRuleController@update` |
| GET | `/api/v1/{tenantSlug}/marketing/social-booking-links` | Bearer + Tenant | marketing.view | `SocialBookingLinkController@index` |
| POST | `/api/v1/{tenantSlug}/marketing/social-booking-links` | Bearer + Tenant | marketing.create | `SocialBookingLinkController@store` |
| DELETE | `/api/v1/{tenantSlug}/marketing/social-booking-links/{socialBookingLink}` | Bearer + Tenant | marketing.delete | `SocialBookingLinkController@destroy` |
| PATCH | `/api/v1/{tenantSlug}/marketing/social-booking-links/{socialBookingLink}` | Bearer + Tenant | marketing.update | `SocialBookingLinkController@update` |
| GET | `/api/v1/{tenantSlug}/marketing/social-links` | Bearer + Tenant | marketing.view | `WorkspaceDashboardController@socialLinks` |

## Tenant › marketplace {#tenant-marketplace}

| Method | Endpoint | Auth | Permission | Handler |
|--------|----------|------|------------|---------|
| GET | `/api/v1/{tenantSlug}/marketplace/commission-rules` | Bearer + Tenant | marketplace.view | `MarketplaceCommissionController@index` |
| POST | `/api/v1/{tenantSlug}/marketplace/commission-rules` | Bearer + Tenant | marketplace.create | `MarketplaceCommissionController@store` |
| DELETE | `/api/v1/{tenantSlug}/marketplace/commission-rules/{marketplaceCommissionRule}` | Bearer + Tenant | marketplace.delete | `MarketplaceCommissionController@destroy` |
| PATCH | `/api/v1/{tenantSlug}/marketplace/commission-rules/{marketplaceCommissionRule}` | Bearer + Tenant | marketplace.update | `MarketplaceCommissionController@update` |
| GET | `/api/v1/{tenantSlug}/marketplace/commissions` | Bearer + Tenant | marketplace.view | `WorkspaceDashboardController@marketplaceCommissions` |
| GET | `/api/v1/{tenantSlug}/marketplace/featured` | Bearer + Tenant | marketplace.view | `WorkspaceDashboardController@marketplaceFeatured` |
| GET | `/api/v1/{tenantSlug}/marketplace/featured-listings` | Bearer + Tenant | marketplace.view | `FeaturedListingController@index` |
| POST | `/api/v1/{tenantSlug}/marketplace/featured-listings` | Bearer + Tenant | marketplace.create | `FeaturedListingController@store` |
| DELETE | `/api/v1/{tenantSlug}/marketplace/featured-listings/{featuredListing}` | Bearer + Tenant | marketplace.delete | `FeaturedListingController@destroy` |
| PATCH | `/api/v1/{tenantSlug}/marketplace/featured-listings/{featuredListing}` | Bearer + Tenant | marketplace.update | `FeaturedListingController@update` |
| GET | `/api/v1/{tenantSlug}/marketplace/profile` | Bearer + Tenant | marketplace.view | `WorkspaceDashboardController@marketplaceProfile` |
| PATCH | `/api/v1/{tenantSlug}/marketplace/profile` | Bearer + Tenant | marketplace.update | `MarketplaceProfileController@update` |
| GET | `/api/v1/{tenantSlug}/marketplace/public-profile` | Public (tenant host/slug) | — | `MarketplaceController@tenantProfile` |

## Tenant › membership-plans {#tenant-membership-plans}

| Method | Endpoint | Auth | Permission | Handler |
|--------|----------|------|------------|---------|
| GET | `/api/v1/{tenantSlug}/membership-plans` | Bearer + Tenant | memberships.view | `MembershipController@index` |
| POST | `/api/v1/{tenantSlug}/membership-plans` | Bearer + Tenant | memberships.create | `MembershipController@store` |
| DELETE | `/api/v1/{tenantSlug}/membership-plans/{membershipPlan}` | Bearer + Tenant | memberships.delete | `MembershipController@destroy` |
| GET | `/api/v1/{tenantSlug}/membership-plans/{membershipPlan}` | Bearer + Tenant | memberships.view | `MembershipController@show` |
| PATCH | `/api/v1/{tenantSlug}/membership-plans/{membershipPlan}` | Bearer + Tenant | memberships.update | `MembershipController@update` |

## Tenant › memberships {#tenant-memberships}

| Method | Endpoint | Auth | Permission | Handler |
|--------|----------|------|------------|---------|
| GET | `/api/v1/{tenantSlug}/memberships/clients` | Bearer + Tenant | memberships.view | `MembershipController@memberships` |
| POST | `/api/v1/{tenantSlug}/memberships/clients` | Bearer + Tenant | memberships.create | `MembershipController@assign` |
| GET | `/api/v1/{tenantSlug}/memberships/plans` | Bearer + Tenant | memberships.view | `MembershipController@index` |
| POST | `/api/v1/{tenantSlug}/memberships/plans` | Bearer + Tenant | memberships.create | `MembershipController@store` |
| DELETE | `/api/v1/{tenantSlug}/memberships/plans/{membershipPlan}` | Bearer + Tenant | memberships.delete | `MembershipController@destroy` |
| GET | `/api/v1/{tenantSlug}/memberships/plans/{membershipPlan}` | Bearer + Tenant | memberships.view | `MembershipController@show` |
| PATCH | `/api/v1/{tenantSlug}/memberships/plans/{membershipPlan}` | Bearer + Tenant | memberships.update | `MembershipController@update` |

## Tenant › operations {#tenant-operations}

| Method | Endpoint | Auth | Permission | Handler |
|--------|----------|------|------------|---------|
| GET | `/api/v1/{tenantSlug}/operations/branch-groups` | Bearer + Tenant | settings.manage | `BranchGroupController@index` |
| POST | `/api/v1/{tenantSlug}/operations/branch-groups` | Bearer + Tenant | settings.manage | `BranchGroupController@store` |
| DELETE | `/api/v1/{tenantSlug}/operations/branch-groups/{branchGroup}` | Bearer + Tenant | settings.manage | `BranchGroupController@destroy` |
| PATCH | `/api/v1/{tenantSlug}/operations/branch-groups/{branchGroup}` | Bearer + Tenant | settings.manage | `BranchGroupController@update` |
| GET | `/api/v1/{tenantSlug}/operations/branch-overrides` | Bearer + Tenant | settings.manage | `BranchGroupController@overrides` |
| DELETE | `/api/v1/{tenantSlug}/operations/branch-overrides/{branchSettingOverride}` | Bearer + Tenant | settings.manage | `BranchGroupController@destroyOverride` |
| POST | `/api/v1/{tenantSlug}/operations/branch-overrides/{location}` | Bearer + Tenant | settings.manage | `BranchGroupController@saveOverride` |

## Tenant › package-redemptions {#tenant-package-redemptions}

| Method | Endpoint | Auth | Permission | Handler |
|--------|----------|------|------------|---------|
| GET | `/api/v1/{tenantSlug}/package-redemptions` | Bearer + Tenant | packages.view | `ServicePackageController@ledger` |
| POST | `/api/v1/{tenantSlug}/package-redemptions` | Bearer + Tenant | packages.update | `ServicePackageController@redeemLegacy` |

## Tenant › packages {#tenant-packages}

| Method | Endpoint | Auth | Permission | Handler |
|--------|----------|------|------------|---------|
| GET | `/api/v1/{tenantSlug}/packages` | Bearer + Tenant | packages.view | `ServicePackageController@index` |
| POST | `/api/v1/{tenantSlug}/packages` | Bearer + Tenant | packages.create | `ServicePackageController@store` |
| GET | `/api/v1/{tenantSlug}/packages/balances` | Bearer + Tenant | packages.view | `ServicePackageController@balances` |
| POST | `/api/v1/{tenantSlug}/packages/balances/{clientPackageBalance}/redeem` | Bearer + Tenant | packages.update | `ServicePackageController@redeem` |
| GET | `/api/v1/{tenantSlug}/packages/ledger` | Bearer + Tenant | packages.view | `ServicePackageController@ledger` |
| POST | `/api/v1/{tenantSlug}/packages/sell` | Bearer + Tenant | packages.create | `ServicePackageController@sell` |
| DELETE | `/api/v1/{tenantSlug}/packages/{servicePackage}` | Bearer + Tenant | packages.delete | `ServicePackageController@destroy` |
| GET | `/api/v1/{tenantSlug}/packages/{servicePackage}` | Bearer + Tenant | packages.view | `ServicePackageController@show` |
| PATCH | `/api/v1/{tenantSlug}/packages/{servicePackage}` | Bearer + Tenant | packages.update | `ServicePackageController@update` |

## Tenant › pay-roles {#tenant-pay-roles}

| Method | Endpoint | Auth | Permission | Handler |
|--------|----------|------|------------|---------|
| GET | `/api/v1/{tenantSlug}/pay-roles` | Bearer + Tenant | staff.view | `StaffPayRoleController@index` |
| POST | `/api/v1/{tenantSlug}/pay-roles` | Bearer + Tenant | staff.update | `StaffPayRoleController@store` |
| DELETE | `/api/v1/{tenantSlug}/pay-roles/{payRole}` | Bearer + Tenant | staff.update | `StaffPayRoleController@destroy` |
| PATCH | `/api/v1/{tenantSlug}/pay-roles/{payRole}` | Bearer + Tenant | staff.update | `StaffPayRoleController@update` |

## Tenant › payment-providers {#tenant-payment-providers}

| Method | Endpoint | Auth | Permission | Handler |
|--------|----------|------|------------|---------|
| GET | `/api/v1/{tenantSlug}/payment-providers/mtn-momo` | Bearer + Tenant | settings.manage | `TenantMtnMomoProviderController@show` |
| PATCH | `/api/v1/{tenantSlug}/payment-providers/mtn-momo` | Bearer + Tenant | settings.manage | `TenantMtnMomoProviderController@update` |
| POST | `/api/v1/{tenantSlug}/payment-providers/mtn-momo/health-check` | Bearer + Tenant | settings.manage | `TenantMtnMomoProviderController@healthCheck` |
| POST | `/api/v1/{tenantSlug}/payment-providers/mtn-momo/request-connection` | Bearer + Tenant | settings.manage | `TenantMtnMomoProviderController@requestConnection` |

## Tenant › payment-requests {#tenant-payment-requests}

| Method | Endpoint | Auth | Permission | Handler |
|--------|----------|------|------------|---------|
| GET | `/api/v1/{tenantSlug}/payment-requests` | Bearer + Tenant | payment_requests.view | `PaymentRequestController@index` |
| POST | `/api/v1/{tenantSlug}/payment-requests` | Bearer + Tenant | payment_requests.create | `PaymentRequestController@store` |
| GET | `/api/v1/{tenantSlug}/payment-requests/{paymentRequest}` | Bearer + Tenant | payment_requests.view | `PaymentRequestController@show` |
| POST | `/api/v1/{tenantSlug}/payment-requests/{paymentRequest}/cancel` | Bearer + Tenant | payment_requests.cancel | `PaymentRequestController@cancel` |
| POST | `/api/v1/{tenantSlug}/payment-requests/{paymentRequest}/retry` | Bearer + Tenant | payment_requests.retry | `PaymentRequestController@retry` |
| POST | `/api/v1/{tenantSlug}/payment-requests/{paymentRequest}/verify` | Bearer + Tenant | payment_requests.verify | `PaymentRequestController@verify` |

## Tenant › payment-settings {#tenant-payment-settings}

| Method | Endpoint | Auth | Permission | Handler |
|--------|----------|------|------------|---------|
| GET | `/api/v1/{tenantSlug}/payment-settings` | Bearer + Tenant | settings.manage | `TenantPaymentSettingController@show` |
| PATCH | `/api/v1/{tenantSlug}/payment-settings` | Bearer + Tenant | settings.manage | `TenantPaymentSettingController@update` |

## Tenant › payments {#tenant-payments}

| Method | Endpoint | Auth | Permission | Handler |
|--------|----------|------|------------|---------|
| GET | `/api/v1/{tenantSlug}/payments` | Bearer + Tenant | bookings.view | `TenantPaymentController@index` |

## Tenant › portfolio-gallery {#tenant-portfolio-gallery}

| Method | Endpoint | Auth | Permission | Handler |
|--------|----------|------|------------|---------|
| GET | `/api/v1/{tenantSlug}/portfolio-gallery` | Bearer + Tenant | services.view | `PortfolioGalleryController@index` |
| POST | `/api/v1/{tenantSlug}/portfolio-gallery` | Bearer + Tenant | services.update | `PortfolioGalleryController@store` |
| POST | `/api/v1/{tenantSlug}/portfolio-gallery/sync` | Bearer + Tenant | services.update | `PortfolioGalleryController@sync` |
| DELETE | `/api/v1/{tenantSlug}/portfolio-gallery/{galleryItem}` | Bearer + Tenant | services.update | `PortfolioGalleryController@destroy` |
| PATCH | `/api/v1/{tenantSlug}/portfolio-gallery/{galleryItem}` | Bearer + Tenant | services.update | `PortfolioGalleryController@update` |

## Tenant › pos {#tenant-pos}

| Method | Endpoint | Auth | Permission | Handler |
|--------|----------|------|------------|---------|
| GET | `/api/v1/{tenantSlug}/pos/summary` | Bearer + Tenant | pos.view | `PosController@summary` |

## Tenant › product-bundles {#tenant-product-bundles}

| Method | Endpoint | Auth | Permission | Handler |
|--------|----------|------|------------|---------|
| GET | `/api/v1/{tenantSlug}/product-bundles` | Bearer + Tenant | inventory.view|pos.view | `ProductBundleController@index` |
| POST | `/api/v1/{tenantSlug}/product-bundles` | Bearer + Tenant | inventory.create | `ProductBundleController@store` |
| DELETE | `/api/v1/{tenantSlug}/product-bundles/{productBundle}` | Bearer + Tenant | inventory.delete | `ProductBundleController@destroy` |
| GET | `/api/v1/{tenantSlug}/product-bundles/{productBundle}` | Bearer + Tenant | inventory.view|pos.view | `ProductBundleController@show` |
| PATCH | `/api/v1/{tenantSlug}/product-bundles/{productBundle}` | Bearer + Tenant | inventory.update | `ProductBundleController@update` |

## Tenant › product-categories {#tenant-product-categories}

| Method | Endpoint | Auth | Permission | Handler |
|--------|----------|------|------------|---------|
| GET | `/api/v1/{tenantSlug}/product-categories` | Bearer + Tenant | inventory.view|pos.view | `ProductCategoryController@index` |
| POST | `/api/v1/{tenantSlug}/product-categories` | Bearer + Tenant | inventory.create | `ProductCategoryController@store` |
| DELETE | `/api/v1/{tenantSlug}/product-categories/{productCategory}` | Bearer + Tenant | inventory.delete | `ProductCategoryController@destroy` |
| PATCH | `/api/v1/{tenantSlug}/product-categories/{productCategory}` | Bearer + Tenant | inventory.update | `ProductCategoryController@update` |

## Tenant › products {#tenant-products}

| Method | Endpoint | Auth | Permission | Handler |
|--------|----------|------|------------|---------|
| GET | `/api/v1/{tenantSlug}/products` | Bearer + Tenant | inventory.view|pos.view | `ProductController@index` |
| POST | `/api/v1/{tenantSlug}/products` | Bearer + Tenant | inventory.create | `ProductController@store` |
| GET | `/api/v1/{tenantSlug}/products/barcode/{code}` | Bearer + Tenant | inventory.view|pos.view | `ProductController@barcode` |
| DELETE | `/api/v1/{tenantSlug}/products/{product}` | Bearer + Tenant | inventory.delete | `ProductController@destroy` |
| PATCH | `/api/v1/{tenantSlug}/products/{product}` | Bearer + Tenant | inventory.update | `ProductController@update` |
| POST | `/api/v1/{tenantSlug}/products/{product}/adjust-stock` | Bearer + Tenant | inventory.update | `ProductController@adjustStock` |

## Tenant › purchase-orders {#tenant-purchase-orders}

| Method | Endpoint | Auth | Permission | Handler |
|--------|----------|------|------------|---------|
| GET | `/api/v1/{tenantSlug}/purchase-orders` | Bearer + Tenant | inventory.view|pos.view | `PurchaseOrderController@index` |
| POST | `/api/v1/{tenantSlug}/purchase-orders` | Bearer + Tenant | inventory.create | `PurchaseOrderController@store` |
| GET | `/api/v1/{tenantSlug}/purchase-orders/{purchaseOrder}` | Bearer + Tenant | inventory.view|pos.view | `PurchaseOrderController@show` |
| PATCH | `/api/v1/{tenantSlug}/purchase-orders/{purchaseOrder}` | Bearer + Tenant | inventory.update | `PurchaseOrderController@update` |
| POST | `/api/v1/{tenantSlug}/purchase-orders/{purchaseOrder}/receive` | Bearer + Tenant | inventory.update | `PurchaseOrderController@receive` |
| POST | `/api/v1/{tenantSlug}/purchase-orders/{purchaseOrder}/send` | Bearer + Tenant | inventory.update | `PurchaseOrderController@send` |

## Tenant › report-builder {#tenant-report-builder}

| Method | Endpoint | Auth | Permission | Handler |
|--------|----------|------|------------|---------|
| GET | `/api/v1/{tenantSlug}/report-builder` | Bearer + Tenant | reports.view | `ReportBuilderController@index` |
| POST | `/api/v1/{tenantSlug}/report-builder` | Bearer + Tenant | reports.create | `ReportBuilderController@store` |
| DELETE | `/api/v1/{tenantSlug}/report-builder/{reportDefinition}` | Bearer + Tenant | reports.delete | `ReportBuilderController@destroy` |
| GET | `/api/v1/{tenantSlug}/report-builder/{reportDefinition}` | Bearer + Tenant | reports.view | `ReportBuilderController@show` |
| PATCH | `/api/v1/{tenantSlug}/report-builder/{reportDefinition}` | Bearer + Tenant | reports.update | `ReportBuilderController@update` |
| POST | `/api/v1/{tenantSlug}/report-builder/{reportDefinition}/preview` | Bearer + Tenant | reports.create | `ReportBuilderController@preview` |

## Tenant › report-definitions {#tenant-report-definitions}

| Method | Endpoint | Auth | Permission | Handler |
|--------|----------|------|------------|---------|
| GET | `/api/v1/{tenantSlug}/report-definitions` | Bearer + Tenant | reports.view | `ReportBuilderController@index` |
| POST | `/api/v1/{tenantSlug}/report-definitions` | Bearer + Tenant | reports.create | `ReportBuilderController@store` |
| POST | `/api/v1/{tenantSlug}/report-definitions/preview` | Bearer + Tenant | reports.create | `ReportBuilderController@previewDraft` |
| DELETE | `/api/v1/{tenantSlug}/report-definitions/{reportDefinition}` | Bearer + Tenant | reports.delete | `ReportBuilderController@destroy` |
| GET | `/api/v1/{tenantSlug}/report-definitions/{reportDefinition}` | Bearer + Tenant | reports.view | `ReportBuilderController@show` |
| PATCH | `/api/v1/{tenantSlug}/report-definitions/{reportDefinition}` | Bearer + Tenant | reports.update | `ReportBuilderController@update` |

## Tenant › report-schedules {#tenant-report-schedules}

| Method | Endpoint | Auth | Permission | Handler |
|--------|----------|------|------------|---------|
| GET | `/api/v1/{tenantSlug}/report-schedules` | Bearer + Tenant | reports.view | `ScheduledReportController@index` |
| POST | `/api/v1/{tenantSlug}/report-schedules` | Bearer + Tenant | reports.create | `ScheduledReportController@store` |
| DELETE | `/api/v1/{tenantSlug}/report-schedules/{scheduledReport}` | Bearer + Tenant | reports.delete | `ScheduledReportController@destroy` |
| PATCH | `/api/v1/{tenantSlug}/report-schedules/{scheduledReport}` | Bearer + Tenant | reports.update | `ScheduledReportController@update` |
| POST | `/api/v1/{tenantSlug}/report-schedules/{scheduledReport}/run` | Bearer + Tenant | reports.update | `ScheduledReportController@run` |

## Tenant › reports {#tenant-reports}

| Method | Endpoint | Auth | Permission | Handler |
|--------|----------|------|------------|---------|
| GET | `/api/v1/{tenantSlug}/reports` | Bearer + Tenant | analytics.view | `ReportsController@index` |

## Tenant › review-requests {#tenant-review-requests}

| Method | Endpoint | Auth | Permission | Handler |
|--------|----------|------|------------|---------|
| GET | `/api/v1/{tenantSlug}/review-requests` | Bearer + Tenant | reviews.view | `ReviewController@requests` |

## Tenant › review-settings {#tenant-review-settings}

| Method | Endpoint | Auth | Permission | Handler |
|--------|----------|------|------------|---------|
| GET | `/api/v1/{tenantSlug}/review-settings` | Bearer + Tenant | reviews.view | `ReviewController@settings` |
| PATCH | `/api/v1/{tenantSlug}/review-settings` | Bearer + Tenant | reviews.update | `ReviewController@updateSettings` |

## Tenant › reviews {#tenant-reviews}

| Method | Endpoint | Auth | Permission | Handler |
|--------|----------|------|------------|---------|
| GET | `/api/v1/{tenantSlug}/reviews` | Bearer + Tenant | reviews.view | `ReviewController@index` |
| GET | `/api/v1/{tenantSlug}/reviews/requests` | Bearer + Tenant | reviews.view | `ReviewController@requests` |
| POST | `/api/v1/{tenantSlug}/reviews/requests/send` | Bearer + Tenant | reviews.create | `ReviewController@sendRequest` |
| POST | `/api/v1/{tenantSlug}/reviews/requests/{reviewRequest}/google-send` | Bearer + Tenant | reviews.update | `ReviewController@googleSend` |
| GET | `/api/v1/{tenantSlug}/reviews/settings` | Bearer + Tenant | reviews.view | `ReviewController@settings` |
| PATCH | `/api/v1/{tenantSlug}/reviews/settings` | Bearer + Tenant | reviews.update | `ReviewController@updateSettings` |
| POST | `/api/v1/{tenantSlug}/reviews/submit/{token}` | Public (tenant host/slug) | — | `PublicReviewController@submit` |
| POST | `/api/v1/{tenantSlug}/reviews/{review}/moderate` | Bearer + Tenant | reviews.update | `ReviewController@moderate` |

## Tenant › sales {#tenant-sales}

| Method | Endpoint | Auth | Permission | Handler |
|--------|----------|------|------------|---------|
| GET | `/api/v1/{tenantSlug}/sales` | Bearer + Tenant | pos.view | `SaleController@index` |
| POST | `/api/v1/{tenantSlug}/sales` | Bearer + Tenant | pos.create | `SaleController@store` |
| POST | `/api/v1/{tenantSlug}/sales/preview` | Bearer + Tenant | pos.create | `SaleController@preview` |
| POST | `/api/v1/{tenantSlug}/sales/validate-coupon` | Bearer + Tenant | pos.create | `SaleController@validateCoupon` |
| GET | `/api/v1/{tenantSlug}/sales/{sale}` | Bearer + Tenant | pos.view | `SaleController@show` |

## Tenant › schedule {#tenant-schedule}

| Method | Endpoint | Auth | Permission | Handler |
|--------|----------|------|------------|---------|
| GET | `/api/v1/{tenantSlug}/schedule/events` | Bearer + Tenant | bookings.view | `ScheduleController@index` |

## Tenant › scheduled-reports {#tenant-scheduled-reports}

| Method | Endpoint | Auth | Permission | Handler |
|--------|----------|------|------------|---------|
| GET | `/api/v1/{tenantSlug}/scheduled-reports` | Bearer + Tenant | reports.view | `ScheduledReportController@index` |
| POST | `/api/v1/{tenantSlug}/scheduled-reports` | Bearer + Tenant | reports.create | `ScheduledReportController@store` |
| DELETE | `/api/v1/{tenantSlug}/scheduled-reports/{scheduledReport}` | Bearer + Tenant | reports.delete | `ScheduledReportController@destroy` |
| PATCH | `/api/v1/{tenantSlug}/scheduled-reports/{scheduledReport}` | Bearer + Tenant | reports.update | `ScheduledReportController@update` |

## Tenant › service-categories {#tenant-service-categories}

| Method | Endpoint | Auth | Permission | Handler |
|--------|----------|------|------------|---------|
| GET | `/api/v1/{tenantSlug}/service-categories` | Bearer + Tenant | services.view|pos.view | `ServiceCategoryController@index` |
| POST | `/api/v1/{tenantSlug}/service-categories` | Bearer + Tenant | services.create | `ServiceCategoryController@store` |
| DELETE | `/api/v1/{tenantSlug}/service-categories/{serviceCategory}` | Bearer + Tenant | services.delete | `ServiceCategoryController@destroy` |
| PATCH | `/api/v1/{tenantSlug}/service-categories/{serviceCategory}` | Bearer + Tenant | services.update | `ServiceCategoryController@update` |

## Tenant › service-packages {#tenant-service-packages}

| Method | Endpoint | Auth | Permission | Handler |
|--------|----------|------|------------|---------|
| GET | `/api/v1/{tenantSlug}/service-packages` | Bearer + Tenant | packages.view | `ServicePackageController@index` |
| POST | `/api/v1/{tenantSlug}/service-packages` | Bearer + Tenant | packages.create | `ServicePackageController@store` |
| DELETE | `/api/v1/{tenantSlug}/service-packages/{servicePackage}` | Bearer + Tenant | packages.delete | `ServicePackageController@destroy` |
| GET | `/api/v1/{tenantSlug}/service-packages/{servicePackage}` | Bearer + Tenant | packages.view | `ServicePackageController@show` |
| PATCH | `/api/v1/{tenantSlug}/service-packages/{servicePackage}` | Bearer + Tenant | packages.update | `ServicePackageController@update` |

## Tenant › services {#tenant-services}

| Method | Endpoint | Auth | Permission | Handler |
|--------|----------|------|------------|---------|
| GET | `/api/v1/{tenantSlug}/services` | Bearer + Tenant | services.view|pos.view | `ServiceController@index` |
| POST | `/api/v1/{tenantSlug}/services` | Bearer + Tenant | services.create | `ServiceController@store` |
| DELETE | `/api/v1/{tenantSlug}/services/{service}` | Bearer + Tenant | services.delete | `ServiceController@destroy` |
| PATCH | `/api/v1/{tenantSlug}/services/{service}` | Bearer + Tenant | services.update | `ServiceController@update` |
| GET | `/api/v1/{tenantSlug}/services/{service}/addons` | Bearer + Tenant | pos.view | `ServiceAddonController@index` |
| GET | `/api/v1/{tenantSlug}/services/{service}/staff-members` | Bearer + Tenant | staff.view | `StaffMemberServiceController@staffForService` |

## Tenant › settings {#tenant-settings}

| Method | Endpoint | Auth | Permission | Handler |
|--------|----------|------|------------|---------|
| GET | `/api/v1/{tenantSlug}/settings` | Bearer + Tenant | settings.manage | `TenantSettingsController@show` |
| PATCH | `/api/v1/{tenantSlug}/settings` | Bearer + Tenant | settings.manage | `TenantSettingsController@update` |
| GET | `/api/v1/{tenantSlug}/settings/integrations` | Bearer + Tenant | marketing.view | `WorkspaceDashboardController@integrationsSettings` |
| PATCH | `/api/v1/{tenantSlug}/settings/integrations` | Bearer + Tenant | marketing.update | `WorkspaceDashboardController@updateIntegrationsSettings` |
| POST | `/api/v1/{tenantSlug}/settings/upload` | Bearer + Tenant | settings.manage | `MediaUploadController@store` |
| GET | `/api/v1/{tenantSlug}/settings/white-label` | Bearer + Tenant | settings.manage | `WorkspaceDashboardController@whiteLabelSettings` |
| PATCH | `/api/v1/{tenantSlug}/settings/white-label` | Bearer + Tenant | settings.manage | `WorkspaceDashboardController@updateWhiteLabelSettings` |

## Tenant › sms {#tenant-sms}

| Method | Endpoint | Auth | Permission | Handler |
|--------|----------|------|------------|---------|
| GET | `/api/v1/{tenantSlug}/sms` | Bearer + Tenant | settings.manage | `TenantSmsController@index` |
| GET | `/api/v1/{tenantSlug}/sms/packages` | Bearer + Tenant | settings.manage | `TenantSmsController@packages` |
| POST | `/api/v1/{tenantSlug}/sms/packages/{smsPackage}/purchase` | Bearer + Tenant | settings.manage | `TenantSmsController@purchasePackage` |
| POST | `/api/v1/{tenantSlug}/sms/purchases/verify` | Bearer + Tenant | settings.manage | `TenantSmsController@verifyPurchase` |
| GET | `/api/v1/{tenantSlug}/sms/wallet` | Bearer + Tenant | settings.manage | `TenantSmsController@wallet` |
| GET | `/api/v1/{tenantSlug}/sms/wallet/transactions` | Bearer + Tenant | settings.manage | `TenantSmsController@walletTransactions` |

## Tenant › social-booking-links {#tenant-social-booking-links}

| Method | Endpoint | Auth | Permission | Handler |
|--------|----------|------|------------|---------|
| GET, POST | `/api/v1/{tenantSlug}/social-booking-links/{socialBookingLink}/track-click` | Public (tenant host/slug) | — | `SocialBookingLinkController@trackClick` |

## Tenant › staff-members {#tenant-staff-members}

| Method | Endpoint | Auth | Permission | Handler |
|--------|----------|------|------------|---------|
| GET | `/api/v1/{tenantSlug}/staff-members` | Bearer + Tenant | staff.view | `StaffMemberController@index` |
| POST | `/api/v1/{tenantSlug}/staff-members` | Bearer + Tenant | staff.create | `StaffMemberController@store` |
| GET | `/api/v1/{tenantSlug}/staff-members/stats` | Bearer + Tenant | staff.view | `StaffMemberController@stats` |
| POST | `/api/v1/{tenantSlug}/staff-members/working-hours/apply` | Bearer + Tenant | staff.update | `StaffWorkingHourController@apply` |
| DELETE | `/api/v1/{tenantSlug}/staff-members/{staffMember}` | Bearer + Tenant | staff.delete | `StaffMemberController@destroy` |
| GET | `/api/v1/{tenantSlug}/staff-members/{staffMember}` | Bearer + Tenant | staff.view | `StaffMemberController@show` |
| PATCH | `/api/v1/{tenantSlug}/staff-members/{staffMember}` | Bearer + Tenant | staff.update | `StaffMemberController@update` |
| GET | `/api/v1/{tenantSlug}/staff-members/{staffMember}/breaks` | Bearer + Tenant | staff.view | `StaffBreakController@index` |
| POST | `/api/v1/{tenantSlug}/staff-members/{staffMember}/breaks` | Bearer + Tenant | staff.update | `StaffBreakController@store` |
| DELETE | `/api/v1/{tenantSlug}/staff-members/{staffMember}/breaks/{staffBreak}` | Bearer + Tenant | staff.update | `StaffBreakController@destroy` |
| PATCH | `/api/v1/{tenantSlug}/staff-members/{staffMember}/breaks/{staffBreak}` | Bearer + Tenant | staff.update | `StaffBreakController@update` |
| PUT | `/api/v1/{tenantSlug}/staff-members/{staffMember}/chair-rental` | Bearer + Tenant | staff.update | `ChairRentalController@upsert` |
| GET | `/api/v1/{tenantSlug}/staff-members/{staffMember}/payroll` | Bearer + Tenant | staff.view | `StaffPayrollProfileController@show` |
| PATCH | `/api/v1/{tenantSlug}/staff-members/{staffMember}/payroll` | Bearer + Tenant | staff.update | `StaffPayrollProfileController@update` |
| GET | `/api/v1/{tenantSlug}/staff-members/{staffMember}/self-employed` | Bearer + Tenant | staff.view | `StaffMemberController@selfEmployedShow` |
| PATCH | `/api/v1/{tenantSlug}/staff-members/{staffMember}/self-employed` | Bearer + Tenant | staff.update | `StaffMemberController@selfEmployedUpdate` |
| GET | `/api/v1/{tenantSlug}/staff-members/{staffMember}/services` | Bearer + Tenant | staff.view | `StaffMemberServiceController@index` |
| POST | `/api/v1/{tenantSlug}/staff-members/{staffMember}/services` | Bearer + Tenant | staff.update | `StaffMemberServiceController@store` |
| PUT | `/api/v1/{tenantSlug}/staff-members/{staffMember}/services/bulk` | Bearer + Tenant | staff.update | `StaffMemberServiceController@bulk` |
| DELETE | `/api/v1/{tenantSlug}/staff-members/{staffMember}/services/{staffService}` | Bearer + Tenant | staff.update | `StaffMemberServiceController@destroy` |
| PATCH | `/api/v1/{tenantSlug}/staff-members/{staffMember}/services/{staffService}` | Bearer + Tenant | staff.update | `StaffMemberServiceController@update` |
| GET | `/api/v1/{tenantSlug}/staff-members/{staffMember}/time-off` | Bearer + Tenant | staff.view | `StaffTimeOffController@index` |
| POST | `/api/v1/{tenantSlug}/staff-members/{staffMember}/time-off` | Bearer + Tenant | staff.update | `StaffTimeOffController@store` |
| PATCH | `/api/v1/{tenantSlug}/staff-members/{staffMember}/time-off/{staffTimeOff}` | Bearer + Tenant | staff.update | `StaffTimeOffController@update` |
| GET | `/api/v1/{tenantSlug}/staff-members/{staffMember}/working-hours` | Bearer + Tenant | staff.view | `StaffWorkingHourController@index` |
| PUT | `/api/v1/{tenantSlug}/staff-members/{staffMember}/working-hours` | Bearer + Tenant | staff.update | `StaffWorkingHourController@update` |
| POST | `/api/v1/{tenantSlug}/staff-members/{staffMember}/working-hours/copy` | Bearer + Tenant | staff.update | `StaffWorkingHourController@copy` |

## Tenant › stock-movements {#tenant-stock-movements}

| Method | Endpoint | Auth | Permission | Handler |
|--------|----------|------|------------|---------|
| GET | `/api/v1/{tenantSlug}/stock-movements` | Bearer + Tenant | inventory.view|pos.view | `StockMovementController@index` |

## Tenant › store {#tenant-store}

| Method | Endpoint | Auth | Permission | Handler |
|--------|----------|------|------------|---------|
| GET | `/api/v1/{tenantSlug}/store/orders` | Bearer + Tenant | inventory.view|pos.view | `StoreOrderController@index` |
| POST | `/api/v1/{tenantSlug}/store/orders` | Public (tenant host/slug) | — | `PublicStoreController@checkout` |
| GET | `/api/v1/{tenantSlug}/store/orders/{storeOrder}` | Bearer + Tenant | inventory.view|pos.view | `StoreOrderController@show` |
| GET | `/api/v1/{tenantSlug}/store/products` | Public (tenant host/slug) | — | `PublicStoreController@catalog` |

## Tenant › suppliers {#tenant-suppliers}

| Method | Endpoint | Auth | Permission | Handler |
|--------|----------|------|------------|---------|
| GET | `/api/v1/{tenantSlug}/suppliers` | Bearer + Tenant | inventory.view|pos.view | `SupplierController@index` |
| POST | `/api/v1/{tenantSlug}/suppliers` | Bearer + Tenant | inventory.create | `SupplierController@store` |
| DELETE | `/api/v1/{tenantSlug}/suppliers/{supplier}` | Bearer + Tenant | inventory.delete | `SupplierController@destroy` |
| PATCH | `/api/v1/{tenantSlug}/suppliers/{supplier}` | Bearer + Tenant | inventory.update | `SupplierController@update` |
| GET | `/api/v1/{tenantSlug}/suppliers/{supplier}/contacts` | Bearer + Tenant | inventory.view|pos.view | `SupplierContactController@index` |
| POST | `/api/v1/{tenantSlug}/suppliers/{supplier}/contacts` | Bearer + Tenant | inventory.create | `SupplierContactController@store` |
| DELETE | `/api/v1/{tenantSlug}/suppliers/{supplier}/contacts/{supplierContact}` | Bearer + Tenant | inventory.delete | `SupplierContactController@destroy` |
| PATCH | `/api/v1/{tenantSlug}/suppliers/{supplier}/contacts/{supplierContact}` | Bearer + Tenant | inventory.update | `SupplierContactController@update` |

## Tenant › team {#tenant-team}

| Method | Endpoint | Auth | Permission | Handler |
|--------|----------|------|------------|---------|
| PATCH | `/api/v1/{tenantSlug}/team/{user}/role` | Bearer + Tenant | settings.manage|staff.update | `TenantTeamRoleController@update` |

## Tenant › waitlist {#tenant-waitlist}

| Method | Endpoint | Auth | Permission | Handler |
|--------|----------|------|------------|---------|
| GET | `/api/v1/{tenantSlug}/waitlist` | Bearer + Tenant | bookings.view | `TenantWaitlistController@index` |
| POST | `/api/v1/{tenantSlug}/waitlist` | Bearer + Tenant | bookings.create | `TenantWaitlistController@store` |
| DELETE | `/api/v1/{tenantSlug}/waitlist/{waitlistEntry}` | Bearer + Tenant | bookings.update | `TenantWaitlistController@destroy` |
| GET | `/api/v1/{tenantSlug}/waitlist/{waitlistEntry}` | Bearer + Tenant | bookings.view | `TenantWaitlistController@show` |
| PATCH | `/api/v1/{tenantSlug}/waitlist/{waitlistEntry}` | Bearer + Tenant | bookings.update | `TenantWaitlistController@update` |
| POST | `/api/v1/{tenantSlug}/waitlist/{waitlistEntry}/convert` | Bearer + Tenant | bookings.create | `TenantWaitlistController@convert` |
| POST | `/api/v1/{tenantSlug}/waitlist/{waitlistEntry}/notify` | Bearer + Tenant | bookings.create | `TenantWaitlistController@notify` |
| GET | `/api/v1/{tenantSlug}/waitlist/{waitlistEntry}/openings` | Bearer + Tenant | bookings.view | `TenantWaitlistController@openings` |

## Tenant › wallet {#tenant-wallet}

| Method | Endpoint | Auth | Permission | Handler |
|--------|----------|------|------------|---------|
| GET | `/api/v1/{tenantSlug}/wallet` | Bearer + Tenant | wallet.view | `TenantWalletController@show` |
| GET | `/api/v1/{tenantSlug}/wallet/transactions` | Bearer + Tenant | wallet.view | `TenantWalletController@transactions` |
| GET | `/api/v1/{tenantSlug}/wallet/transactions/export` | Bearer + Tenant | wallet.export | `TenantWalletController@export` |

## Tenant › white-label {#tenant-white-label}

| Method | Endpoint | Auth | Permission | Handler |
|--------|----------|------|------------|---------|
| GET | `/api/v1/{tenantSlug}/white-label` | Bearer + Tenant | settings.manage | `WhiteLabelController@show` |
| PATCH | `/api/v1/{tenantSlug}/white-label` | Bearer + Tenant | settings.manage | `WhiteLabelController@update` |

## Ops Monitor (non-API)

Internal Laravel dashboard at `/ops` (session login, not Bearer token).

| Method | Path | Description |
|--------|------|-------------|
| GET | `/ops/login` | Login page |
| POST | `/ops/login` | Login submit |
| GET | `/ops` | Overview |
| GET | `/ops/system` | Backend health & errors |
| GET | `/ops/database` | Database browser |
| GET | `/ops/database/tables/{table}` | Browse & search table |
| GET | `/ops/database/tables/{table}/export?format=csv|json` | Export table |
| GET | `/ops/routes` | API route catalog |
| GET | `/ops/requests` | API request log |
| GET | `/ops/errors` | API errors |
| GET | `/ops/logs` | Laravel log tail |
| POST | `/ops/logout` | Sign out |

---

_Regenerate: `php artisan route:list --path=api --json` from `backend-laravel`._
