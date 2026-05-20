<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sms_messages', function (Blueprint $table) {
            $table->string('type')->default('general')->after('provider')->index();
            $table->timestamp('sent_at')->nullable()->after('status');
            $table->jsonb('meta')->nullable()->after('response');
        });

        Schema::create('tenant_sms_usage', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->char('period', 7); // YYYY-MM
            $table->unsignedInteger('sent_count')->default(0);
            $table->unsignedInteger('failed_count')->default(0);
            $table->timestamps();

            $table->unique(['tenant_id', 'period']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tenant_sms_usage');

        Schema::table('sms_messages', function (Blueprint $table) {
            $table->dropColumn(['type', 'sent_at', 'meta']);
        });
    }
};
