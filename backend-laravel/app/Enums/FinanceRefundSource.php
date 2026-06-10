<?php

namespace App\Enums;

enum FinanceRefundSource: string
{
    case PosSale = 'pos_sale';
    case PaymentRequest = 'payment_request';
    case Invoice = 'invoice';

    /** @return list<string> */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
