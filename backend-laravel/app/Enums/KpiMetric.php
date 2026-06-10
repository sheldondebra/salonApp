<?php

namespace App\Enums;

enum KpiMetric: string
{
    case Revenue = 'revenue';
    case Bookings = 'bookings';
    case Staff = 'staff';
    case Retail = 'retail';
}
