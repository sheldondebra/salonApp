<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('staff_members', function (Blueprint $table) {
            $table->foreignId('location_id')->nullable()->after('user_id')->constrained()->nullOnDelete();
            $table->string('initials', 8)->nullable()->after('display_name');
            $table->text('bio')->nullable()->after('title');
            $table->string('avatar_url')->nullable()->after('bio');
            $table->string('employment_status', 32)->default('active')->after('is_active');
            $table->string('employment_type', 32)->nullable()->after('employment_status');
            $table->date('hire_date')->nullable()->after('employment_type');
            $table->string('color_code', 16)->nullable()->after('hire_date');

            $table->index(['tenant_id', 'location_id']);
            $table->index(['tenant_id', 'employment_status']);
            $table->index(['tenant_id', 'is_bookable']);
        });
    }

    public function down(): void
    {
        Schema::table('staff_members', function (Blueprint $table) {
            $table->dropForeign(['location_id']);
            $table->dropIndex(['tenant_id', 'location_id']);
            $table->dropIndex(['tenant_id', 'employment_status']);
            $table->dropIndex(['tenant_id', 'is_bookable']);
            $table->dropColumn([
                'location_id',
                'initials',
                'bio',
                'avatar_url',
                'employment_status',
                'employment_type',
                'hire_date',
                'color_code',
            ]);
        });
    }
};
