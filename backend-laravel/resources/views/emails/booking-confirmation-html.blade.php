@extends('emails.layout')

@section('eyebrow', 'Booking confirmed')

@section('content')
<h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#3D2B30;">You're booked!</h1>
<p style="margin:0 0 20px;">Hi {{ $clientName }},</p>
<p style="margin:0 0 16px;">Your appointment at <strong>{{ $salonName }}</strong> is confirmed.</p>
@include('emails.partials.appointment-details', [
    'serviceName' => $serviceName,
    'when' => $when,
    'staffName' => $staffName ?? null,
    'location' => $location ?? null,
])
<p style="margin:0;color:#8a7a7f;font-size:14px;">Need to reschedule? Contact the salon directly.</p>
@endsection
