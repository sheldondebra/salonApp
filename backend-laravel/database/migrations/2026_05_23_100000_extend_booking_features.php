<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('booking_groups', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->uuid('uuid')->unique();
            $table->foreignId('client_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('location_id')->nullable()->constrained()->nullOnDelete();
            $table->unsignedSmallInteger('party_size')->default(1);
            $table->string('booking_type')->default('standard'); // standard, group, recurring
            $table->json('recurrence')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'created_at']);
        });

        Schema::table('appointments', function (Blueprint $table) {
            $table->foreignId('booking_group_id')->nullable()->after('tenant_id')->constrained()->nullOnDelete();
        });

        Schema::create('booking_waitlist_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->uuid('uuid')->unique();
            $table->foreignId('client_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('client_name');
            $table->string('client_email');
            $table->string('client_phone')->nullable();
            $table->foreignId('location_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('staff_member_id')->nullable()->constrained()->nullOnDelete();
            $table->json('service_ids');
            $table->date('preferred_date');
            $table->string('preferred_time', 5)->nullable();
            $table->unsignedSmallInteger('party_size')->default(1);
            $table->string('status')->default('waiting')->index();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'preferred_date', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('booking_waitlist_entries');
        Schema::table('appointments', function (Blueprint $table) {
            $table->dropConstrainedForeignId('booking_group_id');
        });
        Schema::dropIfExists('booking_groups');
    }
};
