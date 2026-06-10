<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tenant_finance_refunds', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('branch_id')->nullable()->constrained('locations')->nullOnDelete();
            $table->string('source_type', 32);
            $table->unsignedBigInteger('source_id');
            $table->foreignId('sale_id')->nullable()->constrained('sales')->nullOnDelete();
            $table->foreignId('payment_request_id')->nullable()->constrained('payment_requests')->nullOnDelete();
            $table->foreignId('tenant_invoice_id')->nullable()->constrained('tenant_invoices')->nullOnDelete();
            $table->unsignedBigInteger('amount_cents');
            $table->char('currency', 3)->default('GHS');
            $table->string('refund_method', 32)->default('cash');
            $table->string('reason', 64);
            $table->string('status', 32)->default('completed');
            $table->string('gateway_reference')->nullable();
            $table->text('notes')->nullable();
            $table->foreignId('refunded_by_user_id')->constrained('users')->cascadeOnDelete();
            $table->timestamp('refunded_at')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'refunded_at']);
            $table->index(['tenant_id', 'source_type', 'source_id']);
            $table->index(['tenant_id', 'status']);
        });

        Schema::create('tenant_finance_adjustments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('ledger_reference', 128);
            $table->string('source_type', 32)->nullable();
            $table->unsignedBigInteger('source_id')->nullable();
            $table->string('direction', 16);
            $table->unsignedBigInteger('amount_cents');
            $table->char('currency', 3)->default('GHS');
            $table->string('reason', 128);
            $table->text('notes')->nullable();
            $table->foreignId('created_by_user_id')->constrained('users')->cascadeOnDelete();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'created_at']);
            $table->index(['tenant_id', 'ledger_reference']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tenant_finance_adjustments');
        Schema::dropIfExists('tenant_finance_refunds');
    }
};
