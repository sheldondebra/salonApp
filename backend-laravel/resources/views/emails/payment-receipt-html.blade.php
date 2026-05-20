@extends('emails.layout')

@section('eyebrow', 'Payment receipt')

@section('content')
<h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#3D2B30;">Payment received</h1>
<p style="margin:0 0 20px;">Hi {{ $user->name }},</p>
<p style="margin:0 0 16px;">We have received your payment for <strong>{{ $planName }}</strong>. Your subscription is now active.</p>
<table role="presentation" width="100%" style="margin:20px 0;background:#faf7f8;border-radius:12px;padding:16px;">
    <tr>
        <td style="font-size:14px;color:#8a7a7f;">Receipt #</td>
        <td align="right" style="font-weight:600;">{{ $invoice->invoice_number }}</td>
    </tr>
    <tr>
        <td style="font-size:14px;color:#8a7a7f;padding-top:8px;">Amount</td>
        <td align="right" style="font-size:18px;font-weight:700;color:#3D2B30;padding-top:8px;">{{ $amountFormatted }} {{ $invoice->currency }}</td>
    </tr>
    <tr>
        <td style="font-size:14px;color:#8a7a7f;padding-top:8px;">Date</td>
        <td align="right" style="padding-top:8px;">{{ $paidAt }}</td>
    </tr>
</table>
@include('emails.partials.button', ['url' => $ctaUrl, 'label' => 'Complete salon setup →'])
@endsection
