<x-mail::message>
# Payment received

Hi {{ $user->name }},

We have received your payment of **{{ number_format($subscription->final_amount_cents / 100, 2) }} {{ $subscription->currency }}**.

**Reference:** {{ $subscription->provider_reference }}  
**Plan:** {{ $subscription->metadata['plan_name'] ?? $subscription->plan_id }}

You can now set up your salon workspace.

<x-mail::button :url="rtrim(config('services.frontend.url', env('FRONTEND_URL', 'http://localhost:3000')), '/').'/onboarding'">
Set up your salon
</x-mail::button>

Thanks,<br>
{{ config('app.name') }}
</x-mail::message>
