<?php

namespace App\Enums;

enum StoreOrderStatus: string
{
    case Pending = 'pending';
    case Confirmed = 'confirmed';
    case ReadyForPickup = 'ready_for_pickup';
    case Completed = 'completed';
    case Cancelled = 'cancelled';
}
