<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('package_redemptions', function (Blueprint $table) {
            $table->uuid('uuid')->nullable()->unique()->after('tenant_id');
        });

        Schema::table('gift_card_transactions', function (Blueprint $table) {
            $table->uuid('uuid')->nullable()->unique()->after('tenant_id');
        });

        Schema::table('review_settings', function (Blueprint $table) {
            $table->uuid('uuid')->nullable()->unique()->after('tenant_id');
        });

        Schema::table('supplier_contacts', function (Blueprint $table) {
            $table->uuid('uuid')->nullable()->unique()->after('tenant_id');
        });

        Schema::table('purchase_order_items', function (Blueprint $table) {
            $table->uuid('uuid')->nullable()->unique()->after('purchase_order_id');
        });

        Schema::table('product_bundle_items', function (Blueprint $table) {
            $table->uuid('uuid')->nullable()->unique()->after('product_bundle_id');
        });

        Schema::table('report_runs', function (Blueprint $table) {
            $table->uuid('uuid')->nullable()->unique()->after('tenant_id');
        });
    }

    public function down(): void
    {
        Schema::table('report_runs', function (Blueprint $table) {
            $table->dropUnique(['uuid']);
            $table->dropColumn('uuid');
        });

        Schema::table('product_bundle_items', function (Blueprint $table) {
            $table->dropUnique(['uuid']);
            $table->dropColumn('uuid');
        });

        Schema::table('purchase_order_items', function (Blueprint $table) {
            $table->dropUnique(['uuid']);
            $table->dropColumn('uuid');
        });

        Schema::table('supplier_contacts', function (Blueprint $table) {
            $table->dropUnique(['uuid']);
            $table->dropColumn('uuid');
        });

        Schema::table('review_settings', function (Blueprint $table) {
            $table->dropUnique(['uuid']);
            $table->dropColumn('uuid');
        });

        Schema::table('gift_card_transactions', function (Blueprint $table) {
            $table->dropUnique(['uuid']);
            $table->dropColumn('uuid');
        });

        Schema::table('package_redemptions', function (Blueprint $table) {
            $table->dropUnique(['uuid']);
            $table->dropColumn('uuid');
        });
    }
};
