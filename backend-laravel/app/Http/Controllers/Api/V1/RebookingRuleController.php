<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\V1\Concerns\ResolvesTenantFromRequest;
use App\Http\Controllers\Controller;
use App\Models\RebookingRule;
use App\Services\RebookingRuleService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RebookingRuleController extends Controller
{
    use ResolvesTenantFromRequest;

    public function __construct(
        private readonly RebookingRuleService $rules,
    ) {}

    public function index(Request $request, string $tenantSlug): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);
        $filters = $request->validate([
            'is_active' => ['nullable', 'boolean'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        $paginator = $this->rules->paginate($tenant->id, $filters, (int) ($filters['per_page'] ?? 20));

        return response()->json([
            'data' => collect($paginator->items())->map(fn (RebookingRule $rule) => $this->rules->formatRule($rule))->values(),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }

    public function store(Request $request, string $tenantSlug): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'service_id' => ['nullable', 'integer', 'exists:services,id'],
            'staff_member_id' => ['nullable', 'integer', 'exists:staff_members,id'],
            'days_after_visit' => ['required', 'integer', 'min:1', 'max:365'],
            'auto_send_reminder' => ['sometimes', 'boolean'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $rule = $this->rules->create($tenant->id, $data);

        return response()->json(['data' => $this->rules->formatRule($rule)], 201);
    }

    public function update(Request $request, string $tenantSlug, RebookingRule $rebookingRule): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);
        abort_unless($rebookingRule->tenant_id === $tenant->id, 404);

        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'service_id' => ['nullable', 'integer', 'exists:services,id'],
            'staff_member_id' => ['nullable', 'integer', 'exists:staff_members,id'],
            'days_after_visit' => ['sometimes', 'integer', 'min:1', 'max:365'],
            'auto_send_reminder' => ['sometimes', 'boolean'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $rule = $this->rules->update($rebookingRule, $data);

        return response()->json(['data' => $this->rules->formatRule($rule)]);
    }

    public function destroy(Request $request, string $tenantSlug, RebookingRule $rebookingRule): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);
        abort_unless($rebookingRule->tenant_id === $tenant->id, 404);

        $this->rules->delete($rebookingRule);

        return response()->json(['message' => 'Rebooking rule deleted']);
    }

    public function suggestions(Request $request, string $tenantSlug): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);

        return response()->json([
            'data' => $this->rules->suggestions($tenant->id),
        ]);
    }
}
