<?php

namespace App\Enums;

enum PaymentRequestReason: string
{
    case BookingPayment = 'booking_payment';
    case DepositPayment = 'deposit_payment';
    case InvoicePayment = 'invoice_payment';
    case PosSale = 'pos_sale';
    case SmsPackageInvoice = 'sms_package_invoice';
    case Other = 'other';

    /** @return list<string> */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
