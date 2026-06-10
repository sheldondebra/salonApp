<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('staff_breaks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('staff_member_id')->constrained()->cascadeOnDelete();
            $table->foreignId('location_id')->nullable()->constrained()->nullOnDelete();
            $table->string('title');
            $table->string('break_type', 32)->default('lunch');
            $table->unsignedTinyInteger('day_of_week')->nullable();
            $table->time('start_time');
            $table->time('end_time');
            $table->boolean('repeats_weekly')->default(true);
            $table->date('date')->nullable();
            $table->text('note')->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'staff_member_id', 'day_of_week']);
            $table->index(['staff_member_id', 'date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('staff_breaks');
    }
};
