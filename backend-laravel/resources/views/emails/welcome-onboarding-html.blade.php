@extends('emails.layout')

@section('eyebrow', 'Welcome aboard')

@section('content')
<h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#3D2B30;">Welcome to SalonApp, {{ $user->name }}!</h1>
<p style="margin:0 0 16px;">Your salon workspace <strong>{{ $tenant->name }}</strong> is ready. Here is how to get the most from your new dashboard.</p>
<ol style="margin:0;padding-left:20px;color:#3D2B30;">
    <li style="margin-bottom:10px;">Add your services and staff from the workplace menu.</li>
    <li style="margin-bottom:10px;">Share your booking link: <strong>{{ $bookingUrl }}</strong></li>
    <li style="margin-bottom:10px;">Customize branding in Settings anytime.</li>
    <li>Review upcoming appointments on your dashboard.</li>
</ol>
@include('emails.partials.button', ['url' => $dashboardUrl, 'label' => 'Open your dashboard →'])
<p style="margin:24px 0 0;font-size:13px;color:#8a7a7f;">Need help? Reply to this email and our team will assist you.</p>
@endsection
