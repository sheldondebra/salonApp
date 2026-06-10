<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('expense_categories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('name', 64);
            $table->string('slug', 64);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->boolean('is_system')->default(false);
            $table->timestamps();

            $table->unique(['tenant_id', 'slug']);
            $table->index(['tenant_id', 'sort_order']);
        });

        Schema::create('tenant_expenses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('branch_id')->nullable()->constrained('locations')->nullOnDelete();
            $table->foreignId('expense_category_id')->constrained('expense_categories')->cascadeOnDelete();
            $table->foreignId('created_by_user_id')->constrained('users')->cascadeOnDelete();
            $table->string('vendor_name')->nullable();
            $table->unsignedBigInteger('amount_cents');
            $table->unsignedBigInteger('tax_amount_cents')->default(0);
            $table->char('currency', 3)->default('GHS');
            $table->string('payment_method', 32)->default('cash');
            $table->date('expense_date');
            $table->string('receipt_path')->nullable();
            $table->text('note')->nullable();
            $table->string('status', 32)->default('posted');
            $table->timestamps();
            $table->softDeletes();

            $table->index(['tenant_id', 'expense_date']);
            $table->index(['tenant_id', 'expense_category_id']);
            $table->index(['tenant_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tenant_expenses');
        Schema::dropIfExists('expense_categories');
    }
};
