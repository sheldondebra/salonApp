<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('marketplace_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->unique()->constrained()->cascadeOnDelete();
            $table->uuid('uuid')->unique();
            $table->string('headline')->nullable();
            $table->text('bio')->nullable();
            $table->jsonb('categories')->default('[]');
            $table->jsonb('photos')->default('[]');
            $table->boolean('is_published')->default(false);
            $table->decimal('average_rating', 3, 2)->default(0);
            $table->unsignedInteger('review_count')->default(0);
            $table->timestamp('published_at')->nullable();
            $table->timestamps();
        });

        Schema::create('featured_listings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->uuid('uuid')->unique();
            $table->string('placement', 64)->default('homepage');
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('ends_at')->nullable();
            $table->boolean('is_sponsored')->default(false);
            $table->unsignedInteger('billing_cents')->default(0);
            $table->string('status', 32)->default('scheduled');
            $table->timestamps();

            $table->index(['is_sponsored', 'status', 'starts_at']);
        });

        Schema::create('marketplace_commission_rules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->uuid('uuid')->unique();
            $table->string('name');
            $table->unsignedSmallInteger('percent')->default(10);
            $table->unsignedInteger('flat_fee_cents')->default(0);
            $table->string('applies_to', 32)->default('booking');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('client_business_favorites', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['user_id', 'tenant_id']);
        });

        Schema::create('client_recently_viewed', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->timestamp('viewed_at');
            $table->timestamps();

            $table->index(['user_id', 'viewed_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('client_recently_viewed');
        Schema::dropIfExists('client_business_favorites');
        Schema::dropIfExists('marketplace_commission_rules');
        Schema::dropIfExists('featured_listings');
        Schema::dropIfExists('marketplace_profiles');
    }
};
