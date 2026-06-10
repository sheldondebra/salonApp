<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cash_drawer_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->uuid('uuid')->unique();
            $table->foreignId('location_id')->constrained('locations')->cascadeOnDelete();
            $table->foreignId('opened_by_user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('closed_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->unsignedBigInteger('opening_cash_cents')->default(0);
            $table->unsignedBigInteger('expected_cash_cents')->default(0);
            $table->unsignedBigInteger('counted_cash_cents')->nullable();
            $table->bigInteger('difference_cents')->nullable();
            $table->string('status', 32)->default('open');
            $table->json('payment_breakdown')->nullable();
            $table->text('opening_notes')->nullable();
            $table->text('closing_notes')->nullable();
            $table->timestamp('opened_at');
            $table->timestamp('closed_at')->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'location_id', 'status']);
            $table->index(['tenant_id', 'opened_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cash_drawer_sessions');
    }
};
