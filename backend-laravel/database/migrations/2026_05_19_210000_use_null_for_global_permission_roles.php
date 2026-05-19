<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Global roles must have tenant_id NULL so they resolve in any tenant team context
     * (Spatie: role.tenant_id must be null or match the active permissions team).
     */
    public function up(): void
    {
        DB::table('roles')->where('tenant_id', 0)->update(['tenant_id' => null]);
    }

    public function down(): void
    {
        DB::table('roles')->whereNull('tenant_id')->update(['tenant_id' => 0]);
    }
};
