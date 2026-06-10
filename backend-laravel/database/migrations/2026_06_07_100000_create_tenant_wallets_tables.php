<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tenant_wallets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->unique()->constrained()->cascadeOnDelete();
            $table->char('currency', 3)->default('GHS');
            $table->unsignedBigInteger('available_balance')->default(0);
            $table->unsignedBigInteger('pending_balance')->default(0);
            $table->unsignedBigInteger('total_collected')->default(0);
            $table->unsignedBigInteger('total_fees')->default(0);
            $table->unsignedBigInteger('total_settled')->default(0);
            $table->unsignedBigInteger('total_refunded')->default(0);
            $table->string('status', 32)->default('active');
            $table->timestamps();
        });

        Schema::create('tenant_wallet_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('wallet_id')->constrained('tenant_wallets')->cascadeOnDelete();
            $table->foreignId('payment_request_id')->nullable()->constrained()->nullOnDelete();
            $table->unsignedBigInteger('settlement_id')->nullable();
            $table->string('type', 32);
            $table->string('direction', 8);
            $table->unsignedBigInteger('amount');
            $table->unsignedBigInteger('balance_before');
            $table->unsignedBigInteger('balance_after');
            $table->string('reference', 64)->nullable();
            $table->string('description')->nullable();
            $table->jsonb('metadata')->nullable();
            $table->foreignId('created_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('created_at')->useCurrent();

            $table->unique(['tenant_id', 'reference']);
            $table->index(['tenant_id', 'created_at']);
            $table->index(['wallet_id', 'type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tenant_wallet_transactions');
        Schema::dropIfExists('tenant_wallets');
    }
};
