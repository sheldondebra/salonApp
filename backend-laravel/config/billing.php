<?php

return [

    'currency' => env('BILLING_CURRENCY', env('PAYMENT_DEFAULT_CURRENCY', 'GHS')),

    'default_provider' => env('BILLING_PROVIDER', 'paystack'),

    'frontend_url' => rtrim(env('FRONTEND_URL', 'http://localhost:3000'), '/'),

    'frontend_callback' => rtrim(env('FRONTEND_URL', 'http://localhost:3000'), '/').'/checkout/verify',

    'plans' => [
        'starter' => [
            'name' => 'Starter',
            'price_cents' => 9900,
            'interval' => 'month',
        ],
        'growth' => [
            'name' => 'Growth',
            'price_cents' => 49900,
            'interval' => 'month',
        ],
        'professional' => [
            'name' => 'Professional',
            'price_cents' => 129900,
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
