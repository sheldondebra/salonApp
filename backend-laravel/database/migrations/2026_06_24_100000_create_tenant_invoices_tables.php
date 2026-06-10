<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tenant_invoices', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('branch_id')->nullable()->constrained('locations')->nullOnDelete();
            $table->foreignId('customer_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('booking_id')->nullable()->constrained('appointments')->nullOnDelete();
            $table->foreignId('pos_sale_id')->nullable()->constrained('sales')->nullOnDelete();
            $table->foreignId('created_by_user_id')->constrained('users')->cascadeOnDelete();
            $table->string('invoice_number', 32);
            $table->string('status', 32)->default('draft');
            $table->unsignedBigInteger('subtotal_cents')->default(0);
            $table->unsignedBigInteger('discount_total_cents')->default(0);
            $table->unsignedBigInteger('tax_total_cents')->default(0);
            $table->unsignedBigInteger('total_cents')->default(0);
            $table->unsignedBigInteger('amount_paid_cents')->default(0);
            $table->unsignedBigInteger('balance_due_cents')->default(0);
            $table->char('currency', 3)->default('GHS');
            $table->date('due_date')->nullable();
            $table->text('notes')->nullable();
            $table->text('terms')->nullable();
            $table->timestamp('sent_at')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['tenant_id', 'invoice_number']);
            $table->index(['tenant_id', 'status']);
            $table->index(['tenant_id', 'customer_id']);
            $table->index(['tenant_id', 'due_date']);
            $table->index(['tenant_id', 'created_at']);
        });

        Schema::create('tenant_invoice_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_invoice_id')->constrained('tenant_invoices')->cascadeOnDelete();
            $table->string('description');
            $table->unsignedInteger('quantity')->default(1);
            $table->unsignedBigInteger('unit_price_cents');
            $table->unsignedBigInteger('line_total_cents');
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('tenant_invoice_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('tenant_invoice_id')->constrained('tenant_invoices')->cascadeOnDelete();
            $table->string('payment_method', 32);
            $table->unsignedBigInteger('amount_cents');
            $table->string('reference')->nullable();
            $table->foreignId('payment_request_id')->nullable()->constrained('payment_requests')->nullOnDelete();
            $table->foreignId('recorded_by_user_id')->constrained('users')->cascadeOnDelete();
            $table->timestamp('paid_at');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'tenant_invoice_id']);
        });

        Schema::table('payment_requests', function (Blueprint $table) {
            $table->foreign('invoice_id')
                ->references('id')
                ->on('tenant_invoices')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('payment_requests', function (Blueprint $table) {
            $table->dropForeign(['invoice_id']);
        });

        Schema::dropIfExists('tenant_invoice_payments');
        Schema::dropIfExists('tenant_invoice_items');
        Schema::dropIfExists('tenant_invoices');
    }
};
