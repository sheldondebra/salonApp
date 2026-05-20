<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sms_packages', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->unsignedInteger('sms_credits');
            $table->unsignedInteger('bonus_credits')->default(0);
            $table->unsignedBigInteger('price_cents');
            $table->char('currency', 3)->default('GHS');
            $table->unsignedSmallInteger('validity_days')->nullable();
            $table->text('description')->nullable();
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('tenant_sms_wallets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->unique()->constrained()->cascadeOnDelete();
            $table->unsignedBigInteger('balance_credits')->default(0);
            $table->unsignedBigInteger('total_purchased')->default(0);
            $table->unsignedBigInteger('total_allocated')->default(0);
            $table->unsignedBigInteger('total_used')->default(0);
            $table->unsignedInteger('low_balance_threshold')->default(100);
            $table->timestamps();
        });

        Schema::create('sms_wallet_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('type', 32);
            $table->bigInteger('amount');
            $table->unsignedBigInteger('balance_after');
            $table->string('reference_type')->nullable();
            $table->unsignedBigInteger('reference_id')->nullable();
            $table->foreignId('sms_message_id')->nullable()->constrained('sms_messages')->nullOnDelete();
            $table->foreignId('performed_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('notes')->nullable();
            $table->jsonb('meta')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['tenant_id', 'created_at']);
            $table->index(['tenant_id', 'type']);
        });

        Schema::create('sms_sender_ids', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('sender_id', 11);
            $table->string('status', 32)->default('pending');
            $table->boolean('is_default')->default(false);
            $table->timestamp('approved_at')->nullable();
            $table->jsonb('meta')->nullable();
            $table->timestamps();

            $table->unique(['tenant_id', 'sender_id']);
        });

        Schema::create('sms_sender_id_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('requested_sender_id', 11);
            $table->string('status', 40)->default('suggested');
            $table->timestamp('tenant_confirmed_at')->nullable();
            $table->timestamp('submitted_at')->nullable();
            $table->string('provider_reference')->nullable();
            $table->text('notes')->nullable();
            $table->foreignId('reviewed_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['tenant_id', 'status']);
        });

        Schema::create('sms_delivery_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('sms_message_id')->nullable()->constrained('sms_messages')->nullOnDelete();
            $table->string('provider_message_id')->nullable();
            $table->string('recipient');
            $table->string('sender_id')->nullable();
            $table->string('message_type', 32)->default('general');
            $table->string('status', 32)->default('queued');
            $table->unsignedSmallInteger('credits_charged')->default(0);
            $table->jsonb('provider_response')->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'created_at']);
            $table->index(['tenant_id', 'status']);
        });

        Schema::create('sms_purchase_invoices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('sms_package_id')->nullable()->constrained()->nullOnDelete();
            $table->unsignedInteger('credits');
            $table->unsignedBigInteger('amount_cents');
            $table->char('currency', 3)->default('GHS');
            $table->string('status', 32)->default('pending');
            $table->string('payment_gateway')->nullable();
            $table->string('provider_reference')->nullable()->index();
            $table->timestamp('paid_at')->nullable();
            $table->jsonb('meta')->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'status']);
        });

        Schema::create('sms_provider_balances', function (Blueprint $table) {
            $table->id();
            $table->string('provider', 32)->default('mnotify')->unique();
            $table->unsignedBigInteger('balance_credits')->default(0);
            $table->string('status', 32)->default('unknown');
            $table->timestamp('last_synced_at')->nullable();
            $table->jsonb('meta')->nullable();
            $table->timestamps();
        });

        Schema::create('sms_provider_sync_logs', function (Blueprint $table) {
            $table->id();
            $table->string('provider', 32)->default('mnotify');
            $table->string('status', 32);
            $table->unsignedBigInteger('balance_before')->nullable();
            $table->unsignedBigInteger('balance_after')->nullable();
            $table->text('message')->nullable();
            $table->jsonb('payload')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['provider', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sms_provider_sync_logs');
        Schema::dropIfExists('sms_provider_balances');
        Schema::dropIfExists('sms_purchase_invoices');
        Schema::dropIfExists('sms_delivery_logs');
        Schema::dropIfExists('sms_sender_id_requests');
        Schema::dropIfExists('sms_sender_ids');
        Schema::dropIfExists('sms_wallet_transactions');
        Schema::dropIfExists('tenant_sms_wallets');
        Schema::dropIfExists('sms_packages');
    }
};
