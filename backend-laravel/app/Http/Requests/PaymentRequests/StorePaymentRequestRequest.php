<?php

namespace App\Http\Requests\PaymentRequests;

use App\Enums\PaymentRequestReason;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePaymentRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'branch_id' => ['nullable', 'integer', 'exists:locations,id'],
            'customer_id' => ['nullable', 'integer', 'exists:users,id'],
            'booking_id' => ['nullable', 'integer', 'exists:appointments,id'],
            'invoice_id' => ['nullable', 'integer', 'exists:tenant_invoices,id'],
            'pos_sale_id' => ['nullable', 'integer', 'exists:sales,id'],
            'sms_purchase_invoice_id' => ['nullable', 'integer', 'exists:sms_purchase_invoices,id'],
            'amount_cents' => ['required', 'integer', 'min:100'],
            'currency' => ['nullable', 'string', 'size:3'],
            'phone' => ['required', 'string', 'max:30'],
            'email' => ['nullable', 'email', 'max:255'],
            'gateway' => ['required', 'string', Rule::in(['paystack', 'flutterwave', 'mtn_momo'])],
            'payment_channel' => ['nullable', 'string', Rule::in(['mobile_money'])],
            'reason' => ['required', 'string', Rule::in(PaymentRequestReason::values())],
            'description' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
