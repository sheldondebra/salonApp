<?php

return [
    'hours' => [
        'start' => env('BOOKING_DAY_START', '09:00'),
        'end' => env('BOOKING_DAY_END', '18:00'),
    ],
    'slot_interval_minutes' => (int) env('BOOKING_SLOT_INTERVAL', 15),
    'buffer_minutes' => (int) env('BOOKING_BUFFER_MINUTES', 0),
    'max_recurring_occurrences' => (int) env('BOOKING_MAX_RECURRING', 12),
    'max_party_size' => (int) env('BOOKING_MAX_PARTY_SIZE', 10),
];
