<?php

namespace App\Enums;

enum GiftCardTransactionType: string
{
    case Issued = 'issued';
    case Redeemed = 'redeemed';
    case Adjusted = 'adjusted';
    case Expired = 'expired';
}
