<?php

use App\Models\Tenant;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->string('logo_url')->nullable()->after('currency');
            $table->string('banner_url')->nullable()->after('logo_url');
            $table->string('primary_color', 7)->default('#F8BBD0')->after('banner_url');
            $table->string('accent_color', 7)->default('#E879A6')->after('primary_color');
            $table->string('tagline')->nullable()->after('accent_color');
            $table->string('business_email')->nullable()->after('tagline');
            $table->string('business_phone', 30)->nullable()->after('business_email');
            $table->string('address_line1')->nullable()->after('business_phone');
            $table->string('city')->nullable()->after('address_line1');
            $table->char('country', 2)->nullable()->after('city');
            $table->string('website_url')->nullable()->after('country');
        });

        Tenant::query()->each(function (Tenant $tenant) {
            $settings = $tenant->settings ?? [];

            if (empty($settings)) {
                return;
            }

            $tenant->update([
                'logo_url' => $tenant->logo_url ?? ($settings['logo_url'] ?? null),
                'banner_url' => $tenant->banner_url ?? ($settings['banner_url'] ?? null),
                'primary_color' => $tenant->primary_color ?? ($settings['primary_color'] ?? '#F8BBD0'),
                'accent_color' => $tenant->accent_color ?? ($settings['accent_color'] ?? '#E879A6'),
                'tagline' => $tenant->tagline ?? ($settings['tagline'] ?? null),
                'business_email' => $tenant->business_email ?? ($settings['business_email'] ?? null),
                'business_phone' => $tenant->business_phone ?? ($settings['business_phone'] ?? null),
                'address_line1' => $tenant->address_line1 ?? ($settings['address'] ?? null),
            ]);
        });
    }

    public function down(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->dropColumn([
                'logo_url',
                'banner_url',
                'primary_color',
                'accent_color',
                'tagline',
                'business_email',
                'business_phone',
                'address_line1',
                'city',
                'country',
                'website_url',
            ]);
        });
    }
};
