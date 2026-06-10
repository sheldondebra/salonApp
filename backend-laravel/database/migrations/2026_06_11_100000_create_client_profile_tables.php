<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('client_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('preferred_staff_member_id')->nullable()->constrained('staff_members')->nullOnDelete();
            $table->string('preferred_contact', 32)->nullable();
            $table->boolean('sms_reminders')->default(true);
            $table->boolean('email_marketing')->default(false);
            $table->boolean('sms_marketing')->default(false);
            $table->json('tags')->nullable();
            $table->timestamps();

            $table->unique(['tenant_id', 'user_id']);
        });

        Schema::create('client_notes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('author_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('body');
            $table->boolean('is_pinned')->default(false);
            $table->timestamps();

            $table->index(['tenant_id', 'user_id', 'created_at']);
        });

        Schema::create('client_allergies', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('allergen');
            $table->string('severity', 32)->default('moderate');
            $table->text('reaction_notes')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['tenant_id', 'user_id']);
        });

        Schema::create('client_patch_tests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('staff_member_id')->nullable()->constrained()->nullOnDelete();
            $table->string('product_name');
            $table->date('tested_on');
            $table->date('expires_on')->nullable();
            $table->string('result', 32)->default('pending');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'user_id', 'tested_on']);
        });

        Schema::create('client_treatments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('appointment_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('service_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('staff_member_id')->nullable()->constrained()->nullOnDelete();
            $table->string('service_name');
            $table->dateTime('treated_at');
            $table->text('notes')->nullable();
            $table->string('outcome', 64)->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'user_id', 'treated_at']);
        });

        Schema::create('client_media', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('appointment_id')->nullable()->constrained()->nullOnDelete();
            $table->string('kind', 16);
            $table->string('url');
            $table->string('caption')->nullable();
            $table->dateTime('taken_at')->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'user_id', 'kind']);
        });

        Schema::create('client_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('uploaded_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('title');
            $table->string('file_url');
            $table->string('mime_type', 128)->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('client_documents');
        Schema::dropIfExists('client_media');
        Schema::dropIfExists('client_treatments');
        Schema::dropIfExists('client_patch_tests');
        Schema::dropIfExists('client_allergies');
        Schema::dropIfExists('client_notes');
        Schema::dropIfExists('client_profiles');
    }
};
