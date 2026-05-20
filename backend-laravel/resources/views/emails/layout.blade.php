<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $subject ?? config('app.name') }}</title>
</head>
<body style="margin:0;padding:0;background:#f4f0f1;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f0f1;padding:32px 16px;">
    <tr>
        <td align="center">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(61,43,48,0.08);">
                <tr>
                    <td style="background:linear-gradient(135deg,#F8BBD0 0%,#E879A6 100%);padding:28px 32px;text-align:center;">
                        <p style="margin:0;font-size:22px;font-weight:700;color:#3D2B30;letter-spacing:-0.02em;">SalonApp</p>
                        @hasSection('eyebrow')
                        <p style="margin:8px 0 0;font-size:13px;color:#3D2B30;opacity:0.85;">@yield('eyebrow')</p>
                        @endif
                    </td>
                </tr>
                <tr>
                    <td style="padding:32px;color:#3D2B30;font-size:15px;line-height:1.6;">
                        @yield('content')
                    </td>
                </tr>
                <tr>
                    <td style="padding:20px 32px 28px;border-top:1px solid #f0e8ea;font-size:12px;color:#8a7a7f;text-align:center;">
                        &copy; {{ date('Y') }} {{ config('app.name') }}. All rights reserved.
                    </td>
                </tr>
            </table>
        </td>
    </tr>
</table>
</body>
</html>
