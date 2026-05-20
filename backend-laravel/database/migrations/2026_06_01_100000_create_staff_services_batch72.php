<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('staff_services', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('staff_member_id')->constrained()->cascadeOnDelete();
            $table->foreignId('service_id')->constrained()->cascadeOnDelete();
            $table->unsignedSmallInteger('custom_duration_minutes')->nullable();
            $table->unsignedInteger('custom_price_cents')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['staff_member_id', 'service_id']);
            $table->index(['tenant_id', 'service_id', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('staff_services');
    }
};
