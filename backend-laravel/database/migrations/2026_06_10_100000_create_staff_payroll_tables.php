<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('staff_pay_roles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('description')->nullable();
            $table->string('pay_type', 32)->default('salary');
            $table->unsignedBigInteger('base_salary_cents')->default(0);
            $table->unsignedBigInteger('hourly_rate_cents')->default(0);
            $table->decimal('commission_rate', 5, 2)->default(0);
            $table->string('commission_type', 32)->nullable();
            $table->boolean('tip_eligible')->default(true);
            $table->string('color', 16)->nullable();
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['tenant_id', 'name']);
        });

        Schema::create('staff_payroll_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('staff_member_id')->constrained()->cascadeOnDelete();
            $table->foreignId('pay_role_id')->nullable()->constrained('staff_pay_roles')->nullOnDelete();
            $table->string('pay_type', 32)->default('salary');
            $table->unsignedBigInteger('base_salary_cents')->default(0);
            $table->unsignedBigInteger('hourly_rate_cents')->default(0);
            $table->decimal('commission_rate', 5, 2)->default(0);
            $table->string('commission_type', 32)->nullable();
            $table->boolean('tip_eligible')->default(true);
            $table->string('payout_method', 32)->nullable();
            $table->string('payout_account_name')->nullable();
            $table->string('payout_account_number')->nullable();
            $table->date('effective_from')->nullable();
            $table->text('notes')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['tenant_id', 'staff_member_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('staff_payroll_profiles');
        Schema::dropIfExists('staff_pay_roles');
    }
};
