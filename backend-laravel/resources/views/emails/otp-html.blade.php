@extends('emails.layout')

@section('eyebrow', 'Verification code')

@section('content')
<h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#3D2B30;">Your verification code</h1>
<p style="margin:0 0 20px;">Use this code to verify your identity. It expires in {{ $expiresMinutes }} minutes.</p>
<p style="margin:24px 0;font-size:32px;font-weight:700;letter-spacing:0.35em;text-align:center;color:#3D2B30;">{{ $code }}</p>
<p style="margin:0;color:#8a7a7f;font-size:14px;">If you did not request this code, you can ignore this email.</p>
@endsection
