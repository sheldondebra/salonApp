<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payment_provider_accounts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->nullable()->constrained()->cascadeOnDelete();
            $table->string('provider', 32);
            $table->string('account_type', 16);
            $table->string('environment', 16)->default('sandbox');
            $table->string('country', 8)->default('GH');
            $table->char('currency', 3)->default('GHS');
            $table->text('api_user')->nullable();
            $table->text('api_key')->nullable();
            $table->text('subscription_key')->nullable();
            $table->string('target_environment')->nullable();
            $table->string('callback_host')->nullable();
            $table->string('status', 32)->default('not_configured');
            $table->timestamp('last_health_check_at')->nullable();
            $table->timestamp('last_successful_token_at')->nullable();
            $table->timestamp('last_balance_sync_at')->nullable();
            $table->text('last_error')->nullable();
            $table->timestamps();

            $table->index(['provider', 'account_type']);
            $table->index(['tenant_id', 'provider']);
            $table->unique(['tenant_id', 'provider', 'account_type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_provider_accounts');
    }
};
