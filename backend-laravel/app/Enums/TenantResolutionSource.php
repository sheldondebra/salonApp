<?php

namespace App\Enums;

enum TenantResolutionSource: string
{
    case Header = 'header';
    case CustomDomain = 'custom_domain';
    case WorkplaceSlug = 'workplace_slug';
    case RouteSlug = 'route_slug';
}
