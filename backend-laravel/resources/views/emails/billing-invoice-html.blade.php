@extends('emails.layout')

@section('eyebrow', 'Invoice')

@section('content')
<h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#3D2B30;">Invoice {{ $invoice->invoice_number }}</h1>
<p style="margin:0 0 20px;">Hi {{ $user->name }},</p>
<p style="margin:0 0 16px;">Thank you for subscribing to SalonApp. Here is your invoice for the <strong>{{ $planName }}</strong> plan.</p>
<table role="presentation" width="100%" style="margin:20px 0;background:#faf7f8;border-radius:12px;padding:16px;">
    <tr>
        <td style="font-size:14px;color:#8a7a7f;">Amount paid</td>
        <td align="right" style="font-size:18px;font-weight:700;color:#3D2B30;">{{ $amountFormatted }} {{ $invoice->currency }}</td>
    </tr>
    <tr>
        <td style="font-size:14px;color:#8a7a7f;padding-top:8px;">Status</td>
        <td align="right" style="padding-top:8px;"><span style="background:#e8f5e9;color:#2e7d32;padding:4px 10px;border-radius:6px;font-size:12px;font-weight:600;">PAID</span></td>
    </tr>
</table>
@include('emails.partials.button', ['url' => $ctaUrl, 'label' => 'Continue setup →'])
<p style="margin:24px 0 0;font-size:13px;color:#8a7a7f;">Keep this email for your records.</p>
@endsection
