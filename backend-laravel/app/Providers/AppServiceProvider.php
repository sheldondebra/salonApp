<?php

namespace App\Providers;

use App\Integrations\Analytics\AnalyticsRecorder;
use App\Integrations\Payments\FlutterwaveGateway;
use App\Integrations\Payments\PaystackGateway;
use App\Integrations\Payments\PaymentGatewayContract;
use App\Integrations\Sms\MNotifyGateway;
use App\Integrations\Sms\SmsGatewayContract;
use App\Models\Appointment;
use App\Models\Tenant;
use App\Policies\AppointmentPolicy;
use App\Policies\DashboardPolicy;
use App\Policies\TenantPolicy;
use App\Support\PermissionChecker;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(AnalyticsRecorder::class);

        $this->app->bind('payment.paystack', PaystackGateway::class);
        $this->app->bind('payment.flutterwave', FlutterwaveGateway::class);

        $this->app->bind(PaymentGatewayContract::class, PaystackGateway::class);
        $this->app->bind(SmsGatewayContract::class, MNotifyGateway::class);
    }

    public function boot(): void
    {
        PermissionChecker::registerGateBefore();

        Gate::policy(Appointment::class, AppointmentPolicy::class);
        Gate::policy(Tenant::class, TenantPolicy::class);

        Gate::define('viewAnalytics', [DashboardPolicy::class, 'viewAnalytics']);
    }
}
