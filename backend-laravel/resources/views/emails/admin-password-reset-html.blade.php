@extends('emails.layout')

@section('eyebrow', 'Security')

@section('content')
<h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#3D2B30;">Your password has been reset</h1>
<p style="margin:0 0 20px;">Hi {{ $user->name }},</p>
<p style="margin:0 0 16px;">A SalonApp administrator reset your account password. Sign in with the temporary password below, then change it from your account settings as soon as possible.</p>
<table role="presentation" width="100%" style="margin:20px 0;background:#faf7f8;border-radius:12px;padding:16px;">
    <tr>
        <td style="font-size:14px;color:#8a7a7f;">Email</td>
        <td align="right" style="font-weight:600;">{{ $user->email }}</td>
    </tr>
    <tr>
        <td style="font-size:14px;color:#8a7a7f;padding-top:8px;">Temporary password</td>
        <td align="right" style="padding-top:8px;font-family:monospace;font-weight:600;">{{ $temporaryPassword }}</td>
    </tr>
</table>
<p style="margin:0 0 12px;font-size:14px;color:#8a7a7f;">If you did not expect this change, contact support immediately.</p>
@include('emails.partials.button', ['url' => $loginUrl, 'label' => 'Sign in to SalonApp →'])
@endsection
