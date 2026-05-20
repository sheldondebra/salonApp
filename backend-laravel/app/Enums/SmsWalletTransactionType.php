<?php

namespace App\Enums;

enum SmsWalletTransactionType: string
{
    case Purchase = 'purchase';
    case Allocation = 'allocation';
    case Bonus = 'bonus';
    case Correction = 'correction';
    case Usage = 'usage';
    case Refund = 'refund';

    public function isCredit(): bool
    {
        return in_array($this, [self::Purchase, self::Allocation, self::Bonus, self::Correction, self::Refund], true);
    }
}
