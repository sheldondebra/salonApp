<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\V1\Concerns\ResolvesTenantFromRequest;
use App\Http\Controllers\Controller;
use App\Models\Service;
use App\Models\ServiceAddon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ServiceAddonController extends Controller
{
    use ResolvesTenantFromRequest;

    public function index(Request $request, string $tenantSlug, Service $service): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);
        abort_unless($service->tenant_id === $tenant->id, 404);

        $addons = ServiceAddon::query()
            ->where('tenant_id', $tenant->id)
            ->where('service_id', $service->id)
            ->whereBool('is_active')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get(['id', 'service_id', 'name', 'price_cents', 'extra_minutes']);

        return response()->json(['data' => $addons]);
    }
}
