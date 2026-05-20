@extends('emails.layout')

@section('eyebrow', 'Payment received')

@section('content')
<h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#3D2B30;">Payment received</h1>
<p style="margin:0 0 20px;">Hi {{ $clientName }},</p>
<p style="margin:0 0 16px;">We received your payment for <strong>{{ $serviceName }}</strong> at {{ $salonName }}.</p>
<table role="presentation" width="100%" style="margin:20px 0;background:#faf7f8;border-radius:12px;padding:16px;">
    <tr>
        <td style="font-size:14px;color:#8a7a7f;">Amount</td>
        <td align="right" style="font-size:18px;font-weight:700;color:#3D2B30;">{{ $amountFormatted }} {{ $currency }}</td>
    </tr>
</table>
<p style="margin:0;color:#8a7a7f;font-size:14px;">Thank you for your payment.</p>
@endsection
