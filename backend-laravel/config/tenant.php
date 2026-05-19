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

    'slug_segment_index' => 0,

    /*
    |--------------------------------------------------------------------------
    | Default tenant settings
    |--------------------------------------------------------------------------
    */
    'default_timezone' => 'UTC',

    'default_currency' => 'USD',

    'default_plan' => 'starter',

];
