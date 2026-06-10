<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('form_template_library', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->string('name');
            $table->string('category', 64)->default('general');
            $table->text('description')->nullable();
            $table->jsonb('fields')->default('[]');
            $table->boolean('is_active')->default(true);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('form_templates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->uuid('uuid')->unique();
            $table->string('name');
            $table->string('category', 64)->default('general');
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->string('library_slug')->nullable();
            $table->foreignId('created_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['tenant_id', 'is_active']);
        });

        Schema::create('form_fields', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('form_template_id')->constrained()->cascadeOnDelete();
            $table->string('field_key', 64);
            $table->string('field_type', 32);
            $table->string('label');
            $table->text('help_text')->nullable();
            $table->string('placeholder')->nullable();
            $table->jsonb('options')->nullable();
            $table->boolean('is_required')->default(false);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->jsonb('visible_when')->nullable();
            $table->timestamps();

            $table->unique(['form_template_id', 'field_key']);
            $table->index(['form_template_id', 'sort_order']);
        });

        Schema::create('form_submissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->uuid('uuid')->unique();
            $table->foreignId('form_template_id')->constrained()->cascadeOnDelete();
            $table->foreignId('client_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('appointment_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('submitted_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('status', 32)->default('submitted');
            $table->jsonb('answers')->default('{}');
            $table->timestamp('submitted_at')->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'form_template_id', 'created_at']);
            $table->index(['tenant_id', 'client_user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('form_submissions');
        Schema::dropIfExists('form_fields');
        Schema::dropIfExists('form_templates');
        Schema::dropIfExists('form_template_library');
    }
};
