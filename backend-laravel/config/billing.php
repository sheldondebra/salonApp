<?php

return [

    'currency' => env('BILLING_CURRENCY', 'USD'),

    'default_provider' => env('BILLING_PROVIDER', 'paystack'),

    'frontend_callback' => env('FRONTEND_URL', 'http://localhost:3000').'/checkout/verify',

    'plans' => [
        'starter' => [
            'name' => 'Starter',
            'price_cents' => 4900,
            'interval' => 'month',
        ],
        'professional' => [
            'name' => 'Professional',
            'price_cents' => 12900,
            'interval' => 'month',
        ],
        'enterprise' => [
            'name' => 'Enterprise',
            'price_cents' => 0,
            'contact_sales' => true,
            'interval' => 'month',
        ],
    ],

];
