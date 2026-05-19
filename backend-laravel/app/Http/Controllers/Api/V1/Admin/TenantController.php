<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\TenantResource;
use App\Models\Tenant;
use Illuminate\Http\JsonResponse;

class TenantController extends Controller
{
    public function index(): JsonResponse
    {
        $this->authorize('viewAny', Tenant::class);

        $tenants = Tenant::query()
            ->withCount('users')
            ->latest()
            ->paginate(20);

        return TenantResource::collection($tenants)->response();
    }
}
