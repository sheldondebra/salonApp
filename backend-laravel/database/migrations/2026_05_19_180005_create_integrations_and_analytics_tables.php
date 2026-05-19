<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payment_provider_configs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('provider'); // paystack | flutterwave
            $table->boolean('is_enabled')->default(false);
            $table->text('credentials_encrypted')->nullable();
            $table->jsonb('metadata')->nullable();
            $table->timestamps();

            $table->unique(['tenant_id', 'provider']);
        });

        Schema::create('payment_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->uuid('uuid')->unique();
            $table->string('provider');
            $table->string('provider_reference')->nullable();
            $table->unsignedBigInteger('amount_cents');
            $table->char('currency', 3);
            $table->string('status')->default('pending');
            $table->jsonb('payload')->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'status']);
        });

        Schema::create('sms_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->nullable()->constrained()->nullOnDelete();
            $table->string('provider')->default('mnotify');
            $table->string('recipient');
            $table->string('status')->default('queued');
            $table->text('body');
            $table->jsonb('response')->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'status']);
        });

        Schema::create('api_clients', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->uuid('uuid')->unique();
            $table->string('name');
            $table->string('type')->default('wordpress'); // wordpress | mobile | partner
            $table->string('api_key', 64)->unique();
            $table->string('api_secret_hash');
            $table->timestamp('last_used_at')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('analytics_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->nullable()->constrained()->nullOnDelete();
            $table->string('event_name')->index();
            $table->string('source')->default('api');
            $table->jsonb('properties')->nullable();
            $table->timestamp('occurred_at')->useCurrent();
            $table->timestamps();

            $table->index(['tenant_id', 'occurred_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('analytics_events');
        Schema::dropIfExists('api_clients');
        Schema::dropIfExists('sms_messages');
        Schema::dropIfExists('payment_transactions');
        Schema::dropIfExists('payment_provider_configs');
    }
};
