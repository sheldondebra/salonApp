<?php

namespace App\Support;

use App\Enums\TenantResolutionSource;
use App\Models\Tenant;

readonly class TenantResolution
{
    public function __construct(
        public Tenant $tenant,
        public TenantResolutionSource $source,
    ) {}

    public function slug(): string
    {
        return $this->tenant->slug;
    }
}
