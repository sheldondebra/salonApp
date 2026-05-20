<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payment_transactions', function (Blueprint $table) {
            $table->string('purpose')->default('booking')->after('provider');
            $table->foreignId('appointment_id')->nullable()->after('tenant_id')->constrained()->nullOnDelete();
            $table->foreignId('user_id')->nullable()->after('appointment_id')->constrained()->nullOnDelete();
            $table->string('failure_reason')->nullable()->after('status');
            $table->timestamp('paid_at')->nullable()->after('failure_reason');
            $table->jsonb('metadata')->nullable()->after('payload');

            $table->index(['provider_reference']);
            $table->index(['purpose', 'status']);
        });

        Schema::table('appointments', function (Blueprint $table) {
            $table->string('payment_status')->default('unpaid')->after('status');
            $table->unsignedBigInteger('amount_due_cents')->default(0)->after('payment_status');
            $table->unsignedBigInteger('deposit_paid_cents')->default(0)->after('amount_due_cents');
            $table->string('payment_reference')->nullable()->after('deposit_paid_cents');
        });

        Schema::create('payment_failure_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('provider');
            $table->string('provider_reference')->nullable()->index();
            $table->string('purpose');
            $table->unsignedBigInteger('amount_cents')->default(0);
            $table->char('currency', 3)->default('GHS');
            $table->string('failure_reason');
            $table->jsonb('payload')->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_failure_logs');

        Schema::table('appointments', function (Blueprint $table) {
            $table->dropColumn([
                'payment_status',
                'amount_due_cents',
                'deposit_paid_cents',
                'payment_reference',
            ]);
        });

        Schema::table('payment_transactions', function (Blueprint $table) {
            $table->dropForeign(['appointment_id']);
            $table->dropForeign(['user_id']);
            $table->dropColumn([
                'purpose',
                'appointment_id',
                'user_id',
                'failure_reason',
                'paid_at',
                'metadata',
            ]);
        });
    }
};
