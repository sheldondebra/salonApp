@extends('emails.layout')

@section('eyebrow', 'Your account')

@section('content')
<h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#3D2B30;">Your SalonApp login details</h1>
<p style="margin:0 0 20px;">Hi {{ $user->name }},</p>
<p style="margin:0 0 16px;">Your account is ready. Use the credentials below to sign in and finish setting up your salon.</p>
<table role="presentation" width="100%" style="margin:20px 0;background:#faf7f8;border-radius:12px;padding:16px;">
    <tr>
        <td style="font-size:14px;color:#8a7a7f;">Email</td>
        <td align="right" style="font-weight:600;">{{ $user->email }}</td>
    </tr>
    <tr>
        <td style="font-size:14px;color:#8a7a7f;padding-top:8px;">Sign-in URL</td>
        <td align="right" style="padding-top:8px;"><a href="{{ $loginUrl }}" style="color:#E879A6;">{{ $loginUrl }}</a></td>
    </tr>
</table>
<p style="margin:0 0 12px;font-size:14px;">For security, we do not email your password. Use the password you chose at registration, or reset it from the login page if needed.</p>
<h2 style="margin:24px 0 12px;font-size:16px;">What to do next</h2>
<ul style="margin:0;padding-left:20px;">
    <li style="margin-bottom:8px;">Sign in and complete the onboarding wizard</li>
    <li style="margin-bottom:8px;">Set up your business profile and branding</li>
    <li>Start accepting online bookings</li>
</ul>
@include('emails.partials.button', ['url' => $loginUrl, 'label' => 'Sign in to SalonApp →'])
@endsection
