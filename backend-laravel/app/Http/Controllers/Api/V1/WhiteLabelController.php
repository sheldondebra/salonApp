<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\V1\Concerns\ResolvesTenantFromRequest;
use App\Http\Controllers\Controller;
use App\Services\WhiteLabelService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WhiteLabelController extends Controller
{
    use ResolvesTenantFromRequest;

    public function __construct(
        private readonly WhiteLabelService $whiteLabel,
    ) {}

    public function show(Request $request, string $tenantSlug): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);
        $settings = $this->whiteLabel->forTenant($tenant->id);

        return response()->json([
            'data' => $this->whiteLabel->format($settings),
        ]);
    }

    public function update(Request $request, string $tenantSlug): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);
        $data = $request->validate([
            'app_name' => ['nullable', 'string', 'max:255'],
            'app_tagline' => ['nullable', 'string', 'max:255'],
            'mobile_theme' => ['nullable', 'array'],
            'custom_domains' => ['nullable', 'array'],
            'is_enabled' => ['sometimes', 'boolean'],
            'plan_required' => ['nullable', 'string', 'max:255'],
        ]);

        $settings = $this->whiteLabel->update($tenant->id, $data);

        return response()->json([
            'data' => $this->whiteLabel->format($settings),
            'message' => 'White label settings saved',
        ]);
    }
}
