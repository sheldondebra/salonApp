<?php

namespace App\Enums;

enum ClientMembershipStatus: string
{
    case Active = 'active';
    case Pending = 'pending';
    case Cancelled = 'cancelled';
    case Expired = 'expired';
}
