<?php

use App\Enums\RoleName;

return [

    'guard' => 'sanctum',

    /**
     * Resources that support CRUD + export actions.
     */
    'resources' => [
        'tenants',
        'bookings',
        'services',
        'staff',
        'clients',
        'analytics',
        'inventory',
        'pos',
    ],

    'actions' => [
        'view',
        'create',
        'update',
        'delete',
        'export',
    ],

    /**
     * Standalone permissions (not resource.action).
     */
    'standalone' => [
        'billing.manage',
        'settings.manage',
        'staff.settings',
    ],

    /**
     * Role → resource → actions. Use '*' on a role for all permissions.
     * billing/settings use action "manage" → billing.manage / settings.manage
     */
    'roles' => [
        RoleName::SuperAdmin->value => ['*' => true],

        RoleName::OfficeAdmin->value => [
            'tenants' => ['view', 'create', 'update', 'export'],
            'analytics' => ['view', 'export'],
            'billing' => ['manage'],
        ],

        RoleName::TenantOwner->value => [
            'bookings' => ['view', 'create', 'update', 'delete', 'export'],
            'services' => ['view', 'create', 'update', 'delete', 'export'],
            'staff' => ['view', 'create', 'update', 'delete', 'export'],
            'clients' => ['view', 'create', 'update', 'delete', 'export'],
            'analytics' => ['view', 'export'],
            'inventory' => ['view', 'create', 'update', 'delete', 'export'],
            'pos' => ['view', 'create'],
            'billing' => ['manage'],
            'settings' => ['manage'],
        ],

        RoleName::Manager->value => [
            'bookings' => ['view', 'create', 'update', 'delete', 'export'],
            'services' => ['view', 'create', 'update', 'export'],
            'staff' => ['view', 'update'],
            'clients' => ['view', 'create', 'update', 'export'],
            'analytics' => ['view', 'export'],
            'inventory' => ['view', 'create', 'update', 'export'],
            'pos' => ['view', 'create'],
        ],

        RoleName::Staff->value => [
            'bookings' => ['view', 'create', 'update'],
            'services' => ['view'],
            'clients' => ['view'],
            'pos' => ['view', 'create'],
        ],

        RoleName::Client->value => [
            'bookings' => ['view', 'create'],
        ],
    ],

];
