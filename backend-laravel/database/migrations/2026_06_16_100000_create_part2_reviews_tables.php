<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('review_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->unique()->constrained()->cascadeOnDelete();
            $table->boolean('auto_send_after_appointment')->default(true);
            $table->unsignedSmallInteger('delay_hours')->default(2);
            $table->text('request_message_template')->nullable();
            $table->string('google_review_url')->nullable();
            $table->boolean('auto_send_google_review')->default(false);
            $table->unsignedSmallInteger('low_rating_threshold')->default(3);
            $table->timestamps();
        });

        Schema::create('review_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->uuid('uuid')->unique();
            $table->foreignId('appointment_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('client_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('client_email')->nullable();
            $table->string('status', 32)->default('pending');
            $table->timestamp('sent_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->string('token', 64)->unique();
            $table->boolean('google_review_sent')->default(false);
            $table->timestamps();

            $table->index(['tenant_id', 'status', 'created_at']);
        });

        Schema::create('reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->uuid('uuid')->unique();
            $table->foreignId('review_request_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('appointment_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('client_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('staff_member_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('service_id')->nullable()->constrained()->nullOnDelete();
            $table->unsignedTinyInteger('rating');
            $table->text('comment')->nullable();
            $table->string('status', 32)->default('pending');
            $table->boolean('is_verified')->default(false);
            $table->string('source', 32)->default('internal');
            $table->timestamps();

            $table->index(['tenant_id', 'status', 'rating']);
            $table->index(['tenant_id', 'staff_member_id']);
        });

        Schema::create('complaint_cases', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->uuid('uuid')->unique();
            $table->foreignId('review_id')->constrained()->cascadeOnDelete();
            $table->string('status', 32)->default('open');
            $table->foreignId('assigned_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('internal_notes')->nullable();
            $table->text('resolution_note')->nullable();
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('complaint_cases');
        Schema::dropIfExists('reviews');
        Schema::dropIfExists('review_requests');
        Schema::dropIfExists('review_settings');
    }
};
