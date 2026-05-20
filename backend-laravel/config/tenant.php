<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Platform domains
    |--------------------------------------------------------------------------
    */
    'root_domain' => env('TENANT_ROOT_DOMAIN', 'localhost'),

    'workplace_host' => env('TENANT_WORKPLACE_HOST', 'workplace.localhost'),

    /*
    |--------------------------------------------------------------------------
    | Tenant resolution
    |--------------------------------------------------------------------------
    */
    'header' => 'X-Tenant-Id',

    'slug_header' => 'X-Tenant-Slug',

    /** Path segment index for workplace host slug (1 = first segment after domain). */
    'workplace_slug_segment' => (int) env('TENANT_WORKPLACE_SLUG_SEGMENT', 1),

    /** Slugs that must never be treated as tenant identifiers on workplace hosts. */
    'reserved_slugs' => [
        'admin',
        'api',
        'login',
        'register',
        'book',
        'staff',
        'dashboard',
        'appointments',
        'services',
        'clients',
        'settings',
        'reports',
        'coupons',
        'payments',
        'inventory',
        'pos',
        'onboarding',
    ],

    /** Allow custom domains before DNS verification (local dev only). */
    'allow_unverified_domains' => (bool) env('TENANT_ALLOW_UNVERIFIED_DOMAINS', true),

    /**
     * Spatie Permission team id for platform-wide roles (super_admin, office_admin).
     * Not a real tenant row — satisfies model_has_roles.tenant_id NOT NULL.
     */
    'platform_team_id' => 0,

    /*
    |--------------------------------------------------------------------------
    | Default tenant settings
    |--------------------------------------------------------------------------
    */
    'default_timezone' => 'UTC',

    'default_currency' => 'USD',

    'default_plan' => 'starter',

    'default_primary_color' => '#F8BBD0',

    'default_accent_color' => '#E879A6',

    /** Merged into `tenants.settings` on onboarding. */
    'default_settings' => [
        /** When false, public booking uses the tenant address only (no branch picker). */
        'multiple_locations' => false,
        'payments' => [
            'enabled' => false,
            'deposit_percent' => 30,
            'require_full_payment' => false,
        ],
        'inventory' => [
            'allow_negative_stock' => false,
        ],
    ],

];
