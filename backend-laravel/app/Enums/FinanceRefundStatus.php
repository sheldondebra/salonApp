<?php

namespace App\Enums;

enum FinanceRefundStatus: string
{
    case Completed = 'completed';
    case PendingGateway = 'pending_gateway';
    case Failed = 'failed';

    /** @return list<string> */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
