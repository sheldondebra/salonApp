<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('membership_plans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->uuid('uuid')->unique();
            $table->string('name');
            $table->text('description')->nullable();
            $table->unsignedInteger('price_cents')->default(0);
            $table->string('billing_interval', 32)->default('monthly');
            $table->unsignedSmallInteger('discount_percent')->default(0);
            $table->jsonb('free_service_ids')->default('[]');
            $table->boolean('priority_booking')->default(false);
            $table->decimal('points_multiplier', 4, 2)->default(1);
            $table->boolean('is_active')->default(true);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index(['tenant_id', 'is_active']);
        });

        Schema::create('client_memberships', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->uuid('uuid')->unique();
            $table->foreignId('membership_plan_id')->constrained()->cascadeOnDelete();
            $table->foreignId('client_user_id')->constrained('users')->cascadeOnDelete();
            $table->string('status', 32)->default('active');
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('ends_at')->nullable();
            $table->timestamp('next_billing_at')->nullable();
            $table->foreignId('sold_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('sale_id')->nullable()->constrained()->nullOnDelete();
            $table->timestamps();

            $table->index(['tenant_id', 'client_user_id', 'status']);
        });

        Schema::create('service_packages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->uuid('uuid')->unique();
            $table->string('name');
            $table->text('description')->nullable();
            $table->foreignId('service_id')->nullable()->constrained()->nullOnDelete();
            $table->unsignedSmallInteger('sessions_included')->default(1);
            $table->unsignedInteger('price_cents')->default(0);
            $table->unsignedSmallInteger('expiry_days')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['tenant_id', 'is_active']);
        });

        Schema::create('client_package_balances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->uuid('uuid')->unique();
            $table->foreignId('service_package_id')->constrained()->cascadeOnDelete();
            $table->foreignId('client_user_id')->constrained('users')->cascadeOnDelete();
            $table->unsignedSmallInteger('sessions_total')->default(0);
            $table->unsignedSmallInteger('sessions_remaining')->default(0);
            $table->timestamp('expires_at')->nullable();
            $table->string('status', 32)->default('active');
            $table->foreignId('sold_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('sale_id')->nullable()->constrained()->nullOnDelete();
            $table->timestamps();

            $table->index(['tenant_id', 'client_user_id', 'status']);
        });

        Schema::create('package_redemptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('client_package_balance_id')->constrained()->cascadeOnDelete();
            $table->foreignId('appointment_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('sale_id')->nullable()->constrained()->nullOnDelete();
            $table->unsignedSmallInteger('sessions_used')->default(1);
            $table->text('note')->nullable();
            $table->foreignId('redeemed_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['tenant_id', 'created_at']);
        });

        Schema::create('gift_cards', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->uuid('uuid')->unique();
            $table->string('code', 32);
            $table->unsignedInteger('initial_balance_cents')->default(0);
            $table->unsignedInteger('balance_cents')->default(0);
            $table->string('status', 32)->default('active');
            $table->string('recipient_email')->nullable();
            $table->string('recipient_name')->nullable();
            $table->foreignId('purchaser_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('client_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('expires_at')->nullable();
            $table->foreignId('sale_id')->nullable()->constrained()->nullOnDelete();
            $table->timestamps();

            $table->unique(['tenant_id', 'code']);
            $table->index(['tenant_id', 'status']);
        });

        Schema::create('gift_card_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('gift_card_id')->constrained()->cascadeOnDelete();
            $table->string('type', 32);
            $table->integer('amount_cents');
            $table->unsignedInteger('balance_after_cents')->default(0);
            $table->foreignId('sale_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->text('note')->nullable();
            $table->timestamps();

            $table->index(['gift_card_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gift_card_transactions');
        Schema::dropIfExists('gift_cards');
        Schema::dropIfExists('package_redemptions');
        Schema::dropIfExists('client_package_balances');
        Schema::dropIfExists('service_packages');
        Schema::dropIfExists('client_memberships');
        Schema::dropIfExists('membership_plans');
    }
};
