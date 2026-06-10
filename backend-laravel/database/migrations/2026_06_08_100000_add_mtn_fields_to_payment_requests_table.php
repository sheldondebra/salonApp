<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payment_requests', function (Blueprint $table) {
            $table->uuid('transaction_uuid')->nullable()->unique()->after('external_reference');
            $table->timestamp('callback_received_at')->nullable()->after('paid_at');
            $table->timestamp('status_checked_at')->nullable()->after('callback_received_at');
        });
    }

    public function down(): void
    {
        Schema::table('payment_requests', function (Blueprint $table) {
            $table->dropColumn(['transaction_uuid', 'callback_received_at', 'status_checked_at']);
        });
    }
};
