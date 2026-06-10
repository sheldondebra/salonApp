<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('marketing_integrations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('provider', 32);
            $table->jsonb('config')->default('{}');
            $table->boolean('is_active')->default(false);
            $table->boolean('consent_required')->default(true);
            $table->timestamps();

            $table->unique(['tenant_id', 'provider']);
        });

        Schema::create('tracking_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('provider', 32);
            $table->string('event_name', 64);
            $table->jsonb('payload')->nullable();
            $table->string('session_id')->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'provider', 'created_at']);
        });

        Schema::create('abandoned_booking_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->uuid('uuid')->unique();
            $table->string('client_email')->nullable();
            $table->string('client_phone')->nullable();
            $table->string('client_name')->nullable();
            $table->jsonb('draft')->default('{}');
            $table->string('status', 32)->default('abandoned');
            $table->timestamp('last_activity_at')->nullable();
            $table->timestamp('recovered_at')->nullable();
            $table->foreignId('recovered_appointment_id')->nullable()->constrained('appointments')->nullOnDelete();
            $table->unsignedSmallInteger('reminder_count')->default(0);
            $table->timestamp('last_reminder_at')->nullable();
            $table->string('source', 64)->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'status', 'last_activity_at']);
        });

        Schema::create('rebooking_rules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->uuid('uuid')->unique();
            $table->string('name');
            $table->foreignId('service_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('staff_member_id')->nullable()->constrained()->nullOnDelete();
            $table->unsignedSmallInteger('days_after_visit')->default(30);
            $table->boolean('auto_send_reminder')->default(true);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['tenant_id', 'is_active']);
        });

        Schema::create('social_booking_links', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('platform', 32);
            $table->string('url');
            $table->string('utm_source')->nullable();
            $table->string('utm_medium')->nullable();
            $table->string('utm_campaign')->nullable();
            $table->unsignedInteger('click_count')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['tenant_id', 'platform']);
        });

        Schema::create('booking_attributions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('appointment_id')->nullable()->constrained()->nullOnDelete();
            $table->string('source', 64)->nullable();
            $table->string('medium', 64)->nullable();
            $table->string('campaign', 64)->nullable();
            $table->string('referrer')->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'source', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('booking_attributions');
        Schema::dropIfExists('social_booking_links');
        Schema::dropIfExists('rebooking_rules');
        Schema::dropIfExists('abandoned_booking_sessions');
        Schema::dropIfExists('tracking_events');
        Schema::dropIfExists('marketing_integrations');
    }
};
