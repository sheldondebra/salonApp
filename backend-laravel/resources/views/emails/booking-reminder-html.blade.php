@extends('emails.layout')

@section('eyebrow', 'Appointment reminder')

@section('content')
<h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#3D2B30;">See you soon</h1>
<p style="margin:0 0 20px;">Hi {{ $clientName }},</p>
<p style="margin:0 0 16px;">This is a friendly reminder about your upcoming visit to <strong>{{ $salonName }}</strong>.</p>
@include('emails.partials.appointment-details', [
    'serviceName' => $serviceName,
    'when' => $when,
    'staffName' => null,
    'location' => null,
])
@endsection
