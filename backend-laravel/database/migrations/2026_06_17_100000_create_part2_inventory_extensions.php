<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('supplier_contacts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('supplier_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('role')->nullable();
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['supplier_id']);
        });

        Schema::create('purchase_orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->uuid('uuid')->unique();
            $table->foreignId('supplier_id')->constrained()->cascadeOnDelete();
            $table->foreignId('location_id')->nullable()->constrained()->nullOnDelete();
            $table->string('reference')->nullable();
            $table->string('status', 32)->default('draft');
            $table->text('notes')->nullable();
            $table->timestamp('sent_at')->nullable();
            $table->timestamp('received_at')->nullable();
            $table->foreignId('created_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['tenant_id', 'status']);
        });

        Schema::create('purchase_order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('purchase_order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('quantity_ordered')->default(0);
            $table->unsignedInteger('quantity_received')->default(0);
            $table->unsignedInteger('unit_cost_cents')->default(0);
            $table->timestamps();
        });

        Schema::table('stock_movements', function (Blueprint $table) {
            $table->foreignId('purchase_order_id')->nullable()->after('user_id')->constrained()->nullOnDelete();
        });

        Schema::create('product_bundles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->uuid('uuid')->unique();
            $table->string('name');
            $table->text('description')->nullable();
            $table->unsignedInteger('price_cents')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['tenant_id', 'is_active']);
        });

        Schema::create('product_bundle_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_bundle_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->unsignedSmallInteger('quantity')->default(1);
            $table->timestamps();

            $table->unique(['product_bundle_id', 'product_id']);
        });

        Schema::table('products', function (Blueprint $table) {
            $table->boolean('is_store_visible')->default(false)->after('is_active');
            $table->text('store_description')->nullable()->after('description');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['is_store_visible', 'store_description']);
        });
        Schema::dropIfExists('product_bundle_items');
        Schema::dropIfExists('product_bundles');
        Schema::table('stock_movements', function (Blueprint $table) {
            $table->dropConstrainedForeignId('purchase_order_id');
        });
        Schema::dropIfExists('purchase_order_items');
        Schema::dropIfExists('purchase_orders');
        Schema::dropIfExists('supplier_contacts');
    }
};
