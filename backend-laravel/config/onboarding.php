<?php

return [

    'steps' => [
        'business' => [
            'label' => 'Business profile',
            'order' => 1,
            'fields' => ['business_name', 'slug', 'timezone', 'currency'],
        ],
        'business_type' => [
            'label' => 'Business type',
            'order' => 2,
            'fields' => ['business_type'],
        ],
        'services' => [
            'label' => 'Service menu',
            'order' => 3,
            'fields' => ['services'],
        ],
        'gallery' => [
            'label' => 'Before & after gallery',
            'order' => 4,
            'fields' => ['gallery'],
        ],
        'contact' => [
            'label' => 'Contact details',
            'order' => 5,
            'fields' => ['business_phone', 'business_email'],
        ],
        'branding' => [
            'label' => 'Branding',
            'order' => 6,
            'fields' => ['tagline', 'primary_color', 'accent_color'],
        ],
        'location' => [
            'label' => 'Location',
            'order' => 7,
            'fields' => ['address_line1', 'city', 'country', 'multiple_locations'],
        ],
        'review' => [
            'label' => 'Review & launch',
            'order' => 8,
            'fields' => [],
        ],
    ],

];
