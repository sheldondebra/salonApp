<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ops_request_logs', function (Blueprint $table) {
            $table->string('user_agent', 512)->nullable()->after('ip');
            $table->string('client_channel', 24)->nullable()->after('user_agent');

            $table->index(['client_channel', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::table('ops_request_logs', function (Blueprint $table) {
            $table->dropIndex(['client_channel', 'created_at']);
            $table->dropColumn(['user_agent', 'client_channel']);
        });
    }
};
