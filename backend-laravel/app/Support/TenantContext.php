<?php

namespace App\Support;

use App\Enums\TenantResolutionSource;
use App\Models\Tenant;

class TenantContext
{
    protected static ?Tenant $tenant = null;

    protected static ?TenantResolution $resolution = null;

    public static function set(?Tenant $tenant, ?TenantResolution $resolution = null): void
    {
        static::$tenant = $tenant;
        static::$resolution = $resolution;
    }

    public static function get(): ?Tenant
    {
        return static::$tenant;
    }

    public static function resolution(): ?TenantResolution
    {
        return static::$resolution;
    }

    public static function resolutionSource(): ?TenantResolutionSource
    {
        return static::$resolution?->source;
    }

    public static function id(): ?int
    {
        return static::$tenant?->id;
    }

    public static function slug(): ?string
    {
        return static::$tenant?->slug;
    }

    public static function check(): bool
    {
        return static::$tenant !== null;
    }

    public static function clear(): void
    {
        static::$tenant = null;
        static::$resolution = null;
    }
}
