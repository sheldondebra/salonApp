<?php

namespace App\Enums;

enum WalletTransactionType: string
{
    case PaymentCollected = 'payment_collected';
    case PlatformFee = 'platform_fee';
    case GatewayFee = 'gateway_fee';
    case SettlementPending = 'settlement_pending';
    case SettlementPaid = 'settlement_paid';
    case Refund = 'refund';
    case Adjustment = 'adjustment';
    case Reversal = 'reversal';

    /** @return list<string> */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
