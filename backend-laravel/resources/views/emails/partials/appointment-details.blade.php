<table role="presentation" width="100%" style="margin:20px 0;background:#faf7f8;border-radius:12px;padding:16px;">
    <tr>
        <td style="font-size:14px;color:#8a7a7f;">Service</td>
        <td align="right" style="font-weight:600;">{{ $serviceName }}</td>
    </tr>
    <tr>
        <td style="font-size:14px;color:#8a7a7f;padding-top:8px;">When</td>
        <td align="right" style="padding-top:8px;">{{ $when }}</td>
    </tr>
    @if(!empty($staffName))
    <tr>
        <td style="font-size:14px;color:#8a7a7f;padding-top:8px;">With</td>
        <td align="right" style="padding-top:8px;">{{ $staffName }}</td>
    </tr>
    @endif
    @if(!empty($location))
    <tr>
        <td style="font-size:14px;color:#8a7a7f;padding-top:8px;">Location</td>
        <td align="right" style="padding-top:8px;">{{ $location }}</td>
    </tr>
    @endif
</table>
