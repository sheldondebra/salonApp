<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ops_request_logs', function (Blueprint $table) {
            $table->id();
            $table->string('method', 12);
            $table->string('uri', 2048);
            $table->string('route_name')->nullable();
            $table->string('route_action')->nullable();
            $table->unsignedSmallInteger('status_code');
            $table->unsignedInteger('duration_ms')->default(0);
            $table->unsignedBigInteger('user_id')->nullable();
            $table->string('tenant_slug')->nullable();
            $table->string('ip', 45)->nullable();
            $table->text('error_message')->nullable();
            $table->text('response_excerpt')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['status_code', 'created_at']);
            $table->index(['route_name', 'created_at']);
            $table->index(['uri', 'created_at']);
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ops_request_logs');
    }
};
