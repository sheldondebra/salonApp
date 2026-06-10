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
        'forms',
        'analytics',
        'reports',
        'inventory',
        'pos',
        'finance',
        'memberships',
        'packages',
        'gift_cards',
        'reviews',
        'marketing',
        'marketplace',
        'approvals',
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
        'payment_requests.view',
        'payment_requests.create',
        'payment_requests.cancel',
        'payment_requests.retry',
        'payment_requests.verify',
        'wallet.view',
        'wallet.export',
        'wallet.adjust',
        'finance.refund',
        'finance.adjust_transaction',
        'finance.apply_discount',
        'finance.approve_discount',
        'finance.view_tips',
        'finance.payroll.view',
        'finance.payroll.view_self',
        'finance.reconciliation.manage',
        'finance.taxes.manage',
        'office.dashboard.view',
        'office.tenants.view',
        'office.operations.view',
        'office.finance.view',
        'office.support.view',
        'office.settings.manage',
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
            'forms' => ['view', 'create', 'update', 'delete', 'export'],
            'analytics' => ['view', 'export'],
            'reports' => ['view', 'create', 'update', 'delete', 'export'],
            'finance' => ['view', 'export'],
            'inventory' => ['view', 'create', 'update', 'delete', 'export'],
            'pos' => ['view', 'create'],
            'memberships' => ['view', 'create', 'update', 'delete', 'export'],
            'packages' => ['view', 'create', 'update', 'delete', 'export'],
            'gift_cards' => ['view', 'create', 'update', 'delete', 'export'],
            'reviews' => ['view', 'create', 'update', 'delete', 'export'],
            'marketing' => ['view', 'create', 'update', 'delete', 'export'],
            'marketplace' => ['view', 'create', 'update', 'delete', 'export'],
            'approvals' => ['view', 'create', 'update', 'delete', 'export'],
            'billing' => ['manage'],
            'settings' => ['manage'],
        ],

        RoleName::Manager->value => [
            'bookings' => ['view', 'create', 'update', 'delete', 'export'],
            'services' => ['view', 'create', 'update', 'export'],
            'staff' => ['view', 'update'],
            'clients' => ['view', 'create', 'update', 'export'],
            'forms' => ['view', 'create', 'update'],
            'analytics' => ['view', 'export'],
            'reports' => ['view', 'create', 'update', 'export'],
            'finance' => ['view', 'export'],
            'inventory' => ['view', 'create', 'update', 'export'],
            'pos' => ['view', 'create'],
            'memberships' => ['view', 'create', 'update'],
            'packages' => ['view', 'create', 'update'],
            'gift_cards' => ['view', 'create', 'update'],
            'reviews' => ['view', 'create', 'update', 'export'],
            'marketing' => ['view', 'create', 'update', 'export'],
            'marketplace' => ['view', 'create', 'update', 'export'],
            'approvals' => ['view', 'create', 'update', 'export'],
        ],

        RoleName::Staff->value => [
            'bookings' => ['view', 'create', 'update'],
            'services' => ['view'],
            'clients' => ['view'],
            'forms' => ['view', 'create'],
            'reports' => ['view'],
            'pos' => ['view', 'create'],
            'memberships' => ['view', 'create'],
            'packages' => ['view', 'create', 'update'],
            'gift_cards' => ['view', 'create', 'update'],
            'reviews' => ['view', 'create'],
            'marketplace' => ['view'],
        ],

        RoleName::Client->value => [
            'bookings' => ['view', 'create'],
        ],
    ],

];
