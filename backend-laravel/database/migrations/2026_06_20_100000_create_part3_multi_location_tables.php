<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('locations', function (Blueprint $table) {
            $table->decimal('latitude', 10, 7)->nullable()->after('country');
            $table->decimal('longitude', 10, 7)->nullable()->after('latitude');
        });

        Schema::table('tenants', function (Blueprint $table) {
            $table->decimal('latitude', 10, 7)->nullable()->after('country_code');
            $table->decimal('longitude', 10, 7)->nullable()->after('latitude');
        });

        Schema::create('branch_groups', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->uuid('uuid')->unique();
            $table->string('name');
            $table->text('description')->nullable();
            $table->foreignId('manager_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['tenant_id']);
        });

        Schema::create('branch_group_locations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_group_id')->constrained()->cascadeOnDelete();
            $table->foreignId('location_id')->constrained()->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['branch_group_id', 'location_id']);
        });

        Schema::create('branch_setting_overrides', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('location_id')->constrained()->cascadeOnDelete();
            $table->string('setting_key', 128);
            $table->jsonb('value')->nullable();
            $table->timestamps();

            $table->unique(['location_id', 'setting_key']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('branch_setting_overrides');
        Schema::dropIfExists('branch_group_locations');
        Schema::dropIfExists('branch_groups');
        Schema::table('tenants', function (Blueprint $table) {
            $table->dropColumn(['latitude', 'longitude']);
        });
        Schema::table('locations', function (Blueprint $table) {
            $table->dropColumn(['latitude', 'longitude']);
        });
    }
};
