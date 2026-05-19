<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('account_intent')->default('client')->after('user_type');
            $table->string('onboarding_status')->default('complete')->after('account_intent');
            $table->string('selected_plan')->nullable()->after('onboarding_status');
        });

        Schema::create('coupons', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('type'); // percent | fixed
            $table->unsignedInteger('value'); // percent 1-100 or fixed amount in cents
            $table->unsignedInteger('max_redemptions')->nullable();
            $table->unsignedInteger('redemptions_count')->default(0);
            $table->timestamp('expires_at')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('platform_subscriptions', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('plan_id');
            $table->string('status')->default('pending'); // pending | paid | failed | cancelled
            $table->unsignedBigInteger('amount_cents');
            $table->unsignedBigInteger('discount_cents')->default(0);
            $table->unsignedBigInteger('final_amount_cents');
            $table->char('currency', 3)->default('USD');
            $table->foreignId('coupon_id')->nullable()->constrained()->nullOnDelete();
            $table->string('provider')->nullable();
            $table->string('provider_reference')->nullable()->unique();
            $table->timestamp('paid_at')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'status']);
            $table->index('status');
        });

        Schema::create('billing_invoices', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->string('invoice_number')->unique();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('platform_subscription_id')->constrained()->cascadeOnDelete();
            $table->unsignedBigInteger('amount_cents');
            $table->char('currency', 3);
            $table->string('status')->default('draft'); // draft | sent | paid
            $table->json('line_items')->nullable();
            $table->timestamp('sent_at')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('billing_invoices');
        Schema::dropIfExists('platform_subscriptions');
        Schema::dropIfExists('coupons');

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['account_intent', 'onboarding_status', 'selected_plan']);
        });
    }
};
