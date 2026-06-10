<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tenant_payment_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('mode', 32)->default('platform_account');
            $table->string('default_gateway', 32)->default('paystack');
            $table->boolean('mtn_momo_enabled')->default(true);
            $table->boolean('paystack_enabled')->default(true);
            $table->boolean('flutterwave_enabled')->default(true);
            $table->string('settlement_schedule', 16)->default('manual');
            $table->string('settlement_method', 16)->nullable();
            $table->string('settlement_account_name')->nullable();
            $table->string('settlement_account_number', 64)->nullable();
            $table->string('settlement_provider')->nullable();
            $table->text('settlement_notes')->nullable();
            $table->boolean('is_payment_enabled')->default(true);
            $table->foreignId('approved_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->timestamps();

            $table->unique('tenant_id');
            $table->index(['mode', 'is_payment_enabled']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tenant_payment_settings');
    }
};
