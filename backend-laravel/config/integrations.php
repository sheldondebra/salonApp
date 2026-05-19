<?php

return [

  'payments' => [
    'default_currency' => env('PAYMENT_DEFAULT_CURRENCY', 'GHS'),
    'providers' => [
      'paystack' => [
        'public_key' => env('PAYSTACK_PUBLIC_KEY'),
        'secret_key' => env('PAYSTACK_SECRET_KEY'),
        'webhook_secret' => env('PAYSTACK_WEBHOOK_SECRET'),
      ],
      'flutterwave' => [
        'public_key' => env('FLUTTERWAVE_PUBLIC_KEY'),
        'secret_key' => env('FLUTTERWAVE_SECRET_KEY'),
        'webhook_secret' => env('FLUTTERWAVE_WEBHOOK_SECRET'),
      ],
    ],
  ],

  'sms' => [
    'default' => 'mnotify',
    'providers' => [
      'mnotify' => [
        'api_key' => env('MNOTIFY_API_KEY'),
        'sender_id' => env('MNOTIFY_SENDER_ID'),
        'base_url' => env('MNOTIFY_BASE_URL', 'https://api.mnotify.com/api'),
      ],
    ],
  ],

  'wordpress' => [
    'api_key_header' => 'X-Api-Key',
    'api_secret_header' => 'X-Api-Secret',
  ],

  'analytics' => [
    'enabled' => env('ANALYTICS_ENABLED', true),
    'export_driver' => env('ANALYTICS_EXPORT_DRIVER', 'database'),
  ],

];
