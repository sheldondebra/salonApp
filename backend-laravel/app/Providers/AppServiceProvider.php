<?php

namespace App\Providers;

use App\Integrations\Analytics\AnalyticsRecorder;
use App\Integrations\Payments\FlutterwaveGateway;
use App\Integrations\Payments\PaystackGateway;
use App\Integrations\Payments\PaymentGatewayContract;
use App\Integrations\Payments\PaymentGatewayManager;
use App\Integrations\Sms\MNotifyGateway;
use App\Integrations\Sms\SmsGatewayContract;
use App\Models\Appointment;
use App\Models\Location;
use App\Models\Service;
use App\Models\ServiceCategory;
use App\Models\StaffMember;
use App\Models\Tenant;
use App\Models\User;
use App\Policies\AppointmentPolicy;
use App\Policies\DashboardPolicy;
use App\Policies\LocationPolicy;
use App\Policies\ServiceCategoryPolicy;
use App\Policies\ServicePolicy;
use App\Policies\StaffMemberPolicy;
use App\Policies\TenantPolicy;
use App\Policies\UserPolicy;
use App\Support\AdminRouteBindings;
use App\Support\PermissionChecker;
use App\Support\PgsqlBoolean;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(AnalyticsRecorder::class);

        $this->app->bind('payment.paystack', PaystackGateway::class);
        $this->app->bind('payment.flutterwave', FlutterwaveGateway::class);

        $this->app->singleton(PaymentGatewayManager::class);
        $this->app->bind(PaymentGatewayContract::class, PaystackGateway::class);
        $this->app->bind(SmsGatewayContract::class, MNotifyGateway::class);
    }

    public function boot(): void
    {
        PermissionChecker::registerGateBefore();
        PgsqlBoolean::registerMacros();
        AdminRouteBindings::register();

        Gate::policy(Appointment::class, AppointmentPolicy::class);
        Gate::policy(Service::class, ServicePolicy::class);
        Gate::policy(ServiceCategory::class, ServiceCategoryPolicy::class);
        Gate::policy(StaffMember::class, StaffMemberPolicy::class);
        Gate::policy(Location::class, LocationPolicy::class);
        Gate::policy(Tenant::class, TenantPolicy::class);
        Gate::policy(User::class, UserPolicy::class);

        Gate::define('viewAnalytics', [DashboardPolicy::class, 'viewAnalytics']);
    }
}
