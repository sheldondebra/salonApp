<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            $table->string('booked_via', 20)->default('staff')->after('status');
            $table->index(['tenant_id', 'booked_via', 'status']);
        });

        // Existing rows with a linked client account were likely online bookings.
        DB::table('appointments')
            ->whereNotNull('client_user_id')
            ->update(['booked_via' => 'online']);
    }

    public function down(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            $table->dropIndex(['tenant_id', 'booked_via', 'status']);
            $table->dropColumn('booked_via');
        });
    }
};
