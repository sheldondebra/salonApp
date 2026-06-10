<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('service_addons', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('service_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->unsignedBigInteger('price_cents')->default(0);
            $table->unsignedSmallInteger('extra_minutes')->default(0);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['tenant_id', 'service_id', 'is_active']);
        });

        Schema::create('checkout_sessions', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('location_id')->constrained()->cascadeOnDelete();
            $table->foreignId('client_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('appointment_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('created_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('sale_id')->nullable()->constrained()->nullOnDelete();
            $table->string('status', 16)->default('open');
            $table->jsonb('items')->default('[]');
            $table->string('coupon_code', 50)->nullable();
            $table->unsignedBigInteger('tax_cents')->default(0);
            $table->unsignedBigInteger('service_charge_cents')->default(0);
            $table->unsignedBigInteger('tip_cents')->default(0);
            $table->string('payment_method', 32)->nullable();
            $table->text('notes')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'status', 'created_at']);
            $table->index(['tenant_id', 'created_by_user_id']);
        });

        Schema::table('sale_items', function (Blueprint $table) {
            $table->foreignId('service_addon_id')->nullable()->after('product_id')->constrained('service_addons')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('sale_items', function (Blueprint $table) {
            $table->dropConstrainedForeignId('service_addon_id');
        });

        Schema::dropIfExists('checkout_sessions');
        Schema::dropIfExists('service_addons');
    }
};
