<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sms_provider_balances', function (Blueprint $table) {
            $table->text('api_key')->nullable()->after('provider');
            $table->string('sender_id', 32)->nullable()->after('api_key');
            $table->string('base_url', 512)->nullable()->after('sender_id');
            $table->string('balance_url', 512)->nullable()->after('base_url');
            $table->timestamp('verified_at')->nullable()->after('last_synced_at');
        });
    }

    public function down(): void
    {
        Schema::table('sms_provider_balances', function (Blueprint $table) {
            $table->dropColumn(['api_key', 'sender_id', 'base_url', 'balance_url', 'verified_at']);
        });
    }
};
