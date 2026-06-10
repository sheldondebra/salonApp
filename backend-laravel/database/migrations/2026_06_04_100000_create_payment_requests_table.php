<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payment_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('branch_id')->nullable()->constrained('locations')->nullOnDelete();
            $table->foreignId('customer_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('booking_id')->nullable()->constrained('appointments')->nullOnDelete();
            $table->unsignedBigInteger('invoice_id')->nullable();
            $table->foreignId('pos_sale_id')->nullable()->constrained('sales')->nullOnDelete();
            $table->foreignId('sms_purchase_invoice_id')->nullable()->constrained('sms_purchase_invoices')->nullOnDelete();
            $table->foreignId('requested_by_user_id')->constrained('users')->cascadeOnDelete();
            $table->unsignedBigInteger('amount_cents');
            $table->char('currency', 3)->default('GHS');
            $table->string('phone', 30);
            $table->string('email')->nullable();
            $table->string('gateway', 32);
            $table->string('payment_channel', 32)->default('mobile_money');
            $table->string('reason', 64);
            $table->text('description')->nullable();
            $table->string('reference', 64)->unique();
            $table->string('external_reference')->nullable()->index();
            $table->string('status', 32)->default('pending');
            $table->string('provider_status')->nullable();
            $table->jsonb('provider_response')->nullable();
            $table->text('failed_reason')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['tenant_id', 'status']);
            $table->index(['tenant_id', 'gateway']);
            $table->index(['tenant_id', 'reason']);
            $table->index(['tenant_id', 'created_at']);
            $table->index(['tenant_id', 'customer_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_requests');
    }
};
