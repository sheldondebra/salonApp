<?php

namespace App\Enums;

enum PackageBalanceStatus: string
{
    case Active = 'active';
    case Exhausted = 'exhausted';
    case Expired = 'expired';
    case Cancelled = 'cancelled';
}
