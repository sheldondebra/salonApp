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
      'mtn_momo' => [
        'api_user' => env('MTN_MOMO_API_USER'),
        'api_key' => env('MTN_MOMO_API_KEY'),
        'subscription_key' => env('MTN_MOMO_SUBSCRIPTION_KEY'),
        'target_environment' => env('MTN_MOMO_TARGET_ENVIRONMENT', 'sandbox'),
        'callback_host' => env('MTN_MOMO_CALLBACK_HOST'),
        'environment' => env('MTN_MOMO_ENVIRONMENT', 'sandbox'),
        'country' => env('MTN_MOMO_COUNTRY', 'GH'),
        'currency' => env('MTN_MOMO_CURRENCY', 'GHS'),
        'base_url' => env('MTN_MOMO_BASE_URL', 'https://sandbox.momodeveloper.mtn.com'),
        'mock' => (bool) env('MTN_MOMO_MOCK', false),
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
        'balance_url' => env('MNOTIFY_BALANCE_URL', 'https://apps.mnotify.net/smsapi/balance'),
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
