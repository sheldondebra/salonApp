<?php

return [

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => array_filter(explode(',', env('CORS_ALLOWED_ORIGINS', implode(',', [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        // Next.js / web app
        'http://localhost:8081',
        'http://127.0.0.1:8081',
        'http://localhost:8082',
        'http://127.0.0.1:8082',
        // Expo web dev server (alternate ports)
        'http://localhost:19006',
        'http://127.0.0.1:19006',
    ])))),

    'allowed_origins_patterns' => array_filter(explode(',', env('CORS_ALLOWED_ORIGIN_PATTERNS', ''))),

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

  /*
   * Bearer tokens only — no cookie auth. Must stay false when using Authorization header.
   */
    'supports_credentials' => false,

];
