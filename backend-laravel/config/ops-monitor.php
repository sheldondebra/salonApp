<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Ops Monitor
    |--------------------------------------------------------------------------
    | Login-protected dashboard at /ops for API route health, request logs,
    | and Laravel log tailing. Disable in production unless explicitly needed.
    */

    'enabled' => (bool) env('OPS_MONITOR_ENABLED', env('APP_ENV', 'production') === 'local'),

    'username' => env('OPS_MONITOR_USERNAME', 'ops'),

    'password' => env('OPS_MONITOR_PASSWORD', 'changeme'),

    'path' => env('OPS_MONITOR_PATH', 'ops'),

    'retention_days' => (int) env('OPS_MONITOR_RETENTION_DAYS', 14),

    'max_body_length' => 2000,

    'export_max_rows' => (int) env('OPS_MONITOR_EXPORT_MAX_ROWS', 50000),

    'connectivity_probes' => [
        ['label' => 'API health', 'path' => '/api/v1/health', 'expect' => 200],
        ['label' => 'Laravel up', 'path' => '/up', 'expect' => 200],
        ['label' => 'Sanctum CSRF (web login)', 'path' => '/sanctum/csrf-cookie', 'expect' => 204],
    ],

    /*
    | Key business tables shown on the overview and database pages.
    */
    'key_tables' => [
        'tenants' => 'Salons / tenants',
        'users' => 'Users',
        'appointments' => 'Appointments',
        'staff_members' => 'Staff',
        'sales' => 'POS sales',
        'payment_requests' => 'Payment requests',
        'tenant_invoices' => 'Invoices',
        'sms_delivery_logs' => 'SMS sent',
        'ops_request_logs' => 'Ops API logs',
        'failed_jobs' => 'Failed queue jobs',
    ],

];
