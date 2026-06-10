<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('booking_waitlist_entries', function (Blueprint $table) {
            $table->unsignedSmallInteger('priority')->default(0)->after('party_size');
            $table->foreignId('created_by_user_id')->nullable()->after('client_user_id')->constrained('users')->nullOnDelete();
            $table->foreignId('converted_appointment_id')->nullable()->after('status')->constrained('appointments')->nullOnDelete();
            $table->timestamp('notified_at')->nullable()->after('notes');
            $table->index(['tenant_id', 'status', 'priority']);
        });
    }

    public function down(): void
    {
        Schema::table('booking_waitlist_entries', function (Blueprint $table) {
            $table->dropIndex(['tenant_id', 'status', 'priority']);
            $table->dropConstrainedForeignId('converted_appointment_id');
            $table->dropConstrainedForeignId('created_by_user_id');
            $table->dropColumn(['priority', 'notified_at']);
        });
    }
};
