<?php

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        User::query()->whereNull('uuid')->orderBy('id')->each(function (User $user) {
            $user->forceFill(['uuid' => (string) Str::uuid()])->saveQuietly();
        });

        Tenant::query()->whereNull('uuid')->orderBy('id')->each(function (Tenant $tenant) {
            $tenant->forceFill(['uuid' => (string) Str::uuid()])->saveQuietly();
        });
    }

    public function down(): void
    {
        // Non-reversible — UUIDs must remain assigned.
    }
};
