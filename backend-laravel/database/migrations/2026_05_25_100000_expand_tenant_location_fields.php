<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::getConnection()->getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE tenants ALTER COLUMN country TYPE VARCHAR(100) USING country::varchar');
        } else {
            Schema::table('tenants', function (Blueprint $table) {
                $table->string('country', 100)->nullable()->change();
            });
        }

        Schema::table('tenants', function (Blueprint $table) {
            if (! Schema::hasColumn('tenants', 'state')) {
                $table->string('state', 100)->nullable()->after('city');
            }
            if (! Schema::hasColumn('tenants', 'country_code')) {
                $table->string('country_code', 2)->nullable()->after('country');
            }
        });
    }

    public function down(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->dropColumn(['state', 'country_code']);
        });
    }
};
