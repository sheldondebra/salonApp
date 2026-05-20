<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->timestamp('last_login_at')->nullable()->after('is_active');
            $table->string('last_login_ip', 45)->nullable()->after('last_login_at');
            $table->text('last_login_user_agent')->nullable()->after('last_login_ip');
            $table->boolean('is_blocked')->default(false)->after('last_login_user_agent');
            $table->softDeletes();
        });

        Schema::create('user_login_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->string('device_label')->nullable();
            $table->string('status')->default('success'); // success | failed
            $table->string('failure_reason')->nullable();
            $table->timestamp('logged_in_at');
            $table->timestamps();

            $table->index(['user_id', 'logged_in_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_login_logs');

        Schema::table('users', function (Blueprint $table) {
            $table->dropSoftDeletes();
            $table->dropColumn([
                'last_login_at',
                'last_login_ip',
                'last_login_user_agent',
                'is_blocked',
            ]);
        });
    }
};
