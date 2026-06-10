<?php

namespace App\Enums;

enum MarketingIntegrationProvider: string
{
    case GoogleAnalytics = 'google_analytics';
    case MetaPixel = 'meta_pixel';

    /** @return list<string> */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
