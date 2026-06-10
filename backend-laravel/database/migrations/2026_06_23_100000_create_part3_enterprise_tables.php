<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('chair_rental_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('staff_member_id')->unique()->constrained()->cascadeOnDelete();
            $table->unsignedInteger('rental_fee_cents')->default(0);
            $table->string('billing_interval', 32)->default('weekly');
            $table->jsonb('schedule')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        if (Schema::hasTable('staff_members')) {
            $hasEmploymentType = Schema::hasColumn('staff_members', 'employment_type');
            $addEmploymentMode = ! Schema::hasColumn('staff_members', 'employment_mode');
            $addSelfEmployedSettings = ! Schema::hasColumn('staff_members', 'self_employed_settings');

            if ($addEmploymentMode || $addSelfEmployedSettings) {
                Schema::table('staff_members', function (Blueprint $table) use (
                    $hasEmploymentType,
                    $addEmploymentMode,
                    $addSelfEmployedSettings
                ) {
                    if ($addEmploymentMode) {
                        $column = $table->string('employment_mode', 32)->default('employed');
                        if ($hasEmploymentType) {
                            $column->after('employment_type');
                        }
                    }

                    if ($addSelfEmployedSettings) {
                        $column = $table->jsonb('self_employed_settings')->nullable();

                        if ($addEmploymentMode) {
                            $column->after('employment_mode');
                        } elseif ($hasEmploymentType) {
                            $column->after('employment_type');
                        }
                    }
                });
            }
        }

        Schema::create('approval_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->uuid('uuid')->unique();
            $table->string('type', 64);
            $table->string('status', 32)->default('pending');
            $table->string('title');
            $table->text('description')->nullable();
            $table->jsonb('payload')->default('{}');
            $table->foreignId('requested_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('reviewed_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('review_note')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->boolean('is_urgent')->default(false);
            $table->timestamps();

            $table->index(['tenant_id', 'status', 'type']);
        });

        Schema::create('white_label_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('app_name')->nullable();
            $table->string('app_tagline')->nullable();
            $table->jsonb('mobile_theme')->nullable();
            $table->jsonb('custom_domains')->nullable();
            $table->boolean('is_enabled')->default(false);
            $table->string('plan_required')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('white_label_settings');
        Schema::dropIfExists('approval_requests');
        if (Schema::hasTable('staff_members')) {
            $dropColumns = array_values(array_filter([
                Schema::hasColumn('staff_members', 'employment_mode') ? 'employment_mode' : null,
                Schema::hasColumn('staff_members', 'self_employed_settings') ? 'self_employed_settings' : null,
            ]));

            if ($dropColumns !== []) {
                Schema::table('staff_members', function (Blueprint $table) use ($dropColumns) {
                    $table->dropColumn($dropColumns);
                });
            }
        }
        Schema::dropIfExists('chair_rental_profiles');
    }
};
