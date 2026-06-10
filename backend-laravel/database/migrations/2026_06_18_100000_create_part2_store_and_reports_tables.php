<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('store_orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->uuid('uuid')->unique();
            $table->string('customer_name');
            $table->string('customer_email');
            $table->string('customer_phone')->nullable();
            $table->string('fulfillment', 32)->default('click_and_collect');
            $table->string('status', 32)->default('pending');
            $table->unsignedInteger('subtotal_cents')->default(0);
            $table->unsignedInteger('total_cents')->default(0);
            $table->jsonb('items')->default('[]');
            $table->foreignId('location_id')->nullable()->constrained()->nullOnDelete();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'status', 'created_at']);
        });

        Schema::create('report_definitions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->uuid('uuid')->unique();
            $table->string('name');
            $table->string('report_type', 64);
            $table->jsonb('config')->default('{}');
            $table->foreignId('created_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['tenant_id', 'report_type']);
        });

        Schema::create('scheduled_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->uuid('uuid')->unique();
            $table->foreignId('report_definition_id')->constrained()->cascadeOnDelete();
            $table->string('frequency', 32)->default('weekly');
            $table->jsonb('recipients')->default('[]');
            $table->boolean('is_active')->default(true);
            $table->timestamp('next_run_at')->nullable();
            $table->timestamp('last_run_at')->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'is_active']);
        });

        Schema::create('report_runs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('scheduled_report_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('report_definition_id')->nullable()->constrained()->nullOnDelete();
            $table->string('status', 32)->default('completed');
            $table->jsonb('result_summary')->nullable();
            $table->timestamp('sent_at')->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'created_at']);
        });

        Schema::create('kpi_targets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->uuid('uuid')->unique();
            $table->string('metric', 64);
            $table->string('period', 32)->default('monthly');
            $table->unsignedBigInteger('target_value');
            $table->foreignId('location_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('staff_member_id')->nullable()->constrained()->nullOnDelete();
            $table->date('period_start')->nullable();
            $table->date('period_end')->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'metric', 'period']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('kpi_targets');
        Schema::dropIfExists('report_runs');
        Schema::dropIfExists('scheduled_reports');
        Schema::dropIfExists('report_definitions');
        Schema::dropIfExists('store_orders');
    }
};
