<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->text('bio')->nullable()->after('avatar_url');
            $table->date('date_of_birth')->nullable()->after('bio');
            $table->boolean('marketing_opt_in')->default(false)->after('date_of_birth');
        });

        Schema::create('social_accounts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('provider'); // google, apple, facebook
            $table->string('provider_id');
            $table->string('provider_email')->nullable();
            $table->string('avatar_url')->nullable();
            $table->timestamps();

            $table->unique(['provider', 'provider_id']);
            $table->index(['user_id', 'provider']);
        });

        Schema::create('client_favorites', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('favoritable_type'); // service | staff_member
            $table->unsignedBigInteger('favoritable_id');
            $table->timestamps();

            $table->unique(['user_id', 'tenant_id', 'favoritable_type', 'favoritable_id'], 'client_favorites_unique');
        });

        Schema::create('loyalty_wallets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('points_balance')->default(0);
            $table->unsignedInteger('lifetime_points')->default(0);
            $table->timestamps();

            $table->unique(['user_id', 'tenant_id']);
        });

        Schema::create('loyalty_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('loyalty_wallet_id')->constrained()->cascadeOnDelete();
            $table->integer('points'); // positive earn, negative redeem
            $table->string('type'); // earn, redeem, bonus, adjustment
            $table->string('description');
            $table->foreignId('appointment_id')->nullable()->constrained()->nullOnDelete();
            $table->timestamps();

            $table->index(['loyalty_wallet_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('loyalty_transactions');
        Schema::dropIfExists('loyalty_wallets');
        Schema::dropIfExists('client_favorites');
        Schema::dropIfExists('social_accounts');

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['bio', 'date_of_birth', 'marketing_opt_in']);
        });
    }
};
