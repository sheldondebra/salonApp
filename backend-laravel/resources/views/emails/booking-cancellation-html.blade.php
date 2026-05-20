@extends('emails.layout')

@section('eyebrow', 'Appointment cancelled')

@section('content')
<h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#3D2B30;">Appointment cancelled</h1>
<p style="margin:0 0 20px;">Hi {{ $clientName }},</p>
<p style="margin:0 0 16px;">Your appointment at <strong>{{ $salonName }}</strong> has been cancelled.</p>
@include('emails.partials.appointment-details', [
    'serviceName' => $serviceName,
    'when' => $when,
    'staffName' => null,
    'location' => null,
])
<p style="margin:0;color:#8a7a7f;font-size:14px;">We hope to see you again soon.</p>
@endsection
