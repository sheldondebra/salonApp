<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('coupons', function (Blueprint $table) {
            $table->foreignId('tenant_id')->nullable()->after('id')->constrained()->cascadeOnDelete();
            $table->string('scope')->default('subscription')->after('type');
            $table->timestamp('starts_at')->nullable()->after('scope');
            $table->json('metadata')->nullable()->after('expires_at');

            $table->index(['tenant_id', 'scope', 'is_active']);
        });

        Schema::table('coupons', function (Blueprint $table) {
            $table->dropUnique(['code']);
        });

        Schema::table('coupons', function (Blueprint $table) {
            $table->unique(['tenant_id', 'code']);
        });

        Schema::table('payment_transactions', function (Blueprint $table) {
            $table->foreignId('coupon_id')->nullable()->after('user_id')->constrained()->nullOnDelete();
            $table->unsignedBigInteger('subtotal_cents')->default(0)->after('amount_cents');
            $table->unsignedBigInteger('discount_cents')->default(0)->after('subtotal_cents');
        });
    }

    public function down(): void
    {
        Schema::table('payment_transactions', function (Blueprint $table) {
            $table->dropForeign(['coupon_id']);
            $table->dropColumn(['coupon_id', 'subtotal_cents', 'discount_cents']);
        });

        Schema::table('coupons', function (Blueprint $table) {
            $table->dropUnique(['tenant_id', 'code']);
            $table->unique('code');
            $table->dropConstrainedForeignId('tenant_id');
            $table->dropColumn(['scope', 'starts_at', 'metadata']);
        });
    }
};
