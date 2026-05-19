<x-mail::message>
# Invoice {{ $invoice->invoice_number }}

Hi {{ $user->name }},

Thank you for choosing SalonApp. Here is your invoice for the **{{ $subscription->metadata['plan_name'] ?? $subscription->plan_id }}** plan.

**Amount due:** {{ number_format($invoice->amount_cents / 100, 2) }} {{ $invoice->currency }}

**Status:** Paid

<x-mail::button :url="config('billing.frontend_callback')">
Continue to onboarding
</x-mail::button>

Thanks,<br>
{{ config('app.name') }}
</x-mail::message>
