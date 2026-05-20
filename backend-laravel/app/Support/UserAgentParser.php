<?php

namespace App\Support;

class UserAgentParser
{
    public static function deviceLabel(?string $userAgent): string
    {
        if (! $userAgent) {
            return 'Unknown device';
        }

        $ua = strtolower($userAgent);

        if (str_contains($ua, 'iphone')) {
            return 'iPhone';
        }
        if (str_contains($ua, 'ipad')) {
            return 'iPad';
        }
        if (str_contains($ua, 'android')) {
            return 'Android';
        }
        if (str_contains($ua, 'mac os') || str_contains($ua, 'macintosh')) {
            return 'Mac';
        }
        if (str_contains($ua, 'windows')) {
            return 'Windows';
        }
        if (str_contains($ua, 'linux')) {
            return 'Linux';
        }

        if (str_contains($ua, 'chrome')) {
            return 'Chrome browser';
        }
        if (str_contains($ua, 'firefox')) {
            return 'Firefox browser';
        }
        if (str_contains($ua, 'safari')) {
            return 'Safari browser';
        }

        return 'Web browser';
    }
}
