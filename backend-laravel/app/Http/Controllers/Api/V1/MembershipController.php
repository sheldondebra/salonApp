<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\ClientMembershipStatus;
use App\Http\Controllers\Api\V1\Concerns\ResolvesTenantFromRequest;
use App\Http\Controllers\Controller;
use App\Models\ClientMembership;
use App\Models\MembershipPlan;
use App\Services\MembershipService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class MembershipController extends Controller
{
    use ResolvesTenantFromRequest;

    public function __construct(
        private readonly MembershipService $memberships,
    ) {}

    public function index(Request $request, string $tenantSlug): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);
        $filters = $request->validate([
            'q' => ['nullable', 'string', 'max:100'],
            'is_active' => ['nullable', 'boolean'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        $paginator = $this->memberships->paginatePlans($tenant->id, $filters, (int) ($filters['per_page'] ?? 20));

        return response()->json([
            'data' => collect($paginator->items())->map(fn (MembershipPlan $plan) => $this->memberships->formatPlan($plan)),
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
            'description' => ['nullable', 'string', 'max:5000'],
            'price_cents' => ['required', 'integer', 'min:0'],
            'billing_interval' => ['nullable', 'string', Rule::in(['weekly', 'monthly', 'yearly'])],
            'discount_percent' => ['nullable', 'integer', 'min:0', 'max:100'],
            'free_service_ids' => ['nullable', 'array'],
            'free_service_ids.*' => ['integer', 'exists:services,id'],
            'priority_booking' => ['nullable', 'boolean'],
            'points_multiplier' => ['nullable', 'numeric', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ]);

        $plan = $this->memberships->createPlan($tenant->id, $data);

        return response()->json(['data' => $this->memberships->formatPlan($plan)], 201);
    }

    public function show(Request $request, string $tenantSlug, MembershipPlan $membershipPlan): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);
        abort_unless($membershipPlan->tenant_id === $tenant->id, 404);

        return response()->json(['data' => $this->memberships->formatPlan($membershipPlan)]);
    }

    public function update(Request $request, string $tenantSlug, MembershipPlan $membershipPlan): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);
        abort_unless($membershipPlan->tenant_id === $tenant->id, 404);

        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'price_cents' => ['sometimes', 'integer', 'min:0'],
            'billing_interval' => ['nullable', 'string', Rule::in(['weekly', 'monthly', 'yearly'])],
            'discount_percent' => ['nullable', 'integer', 'min:0', 'max:100'],
            'free_service_ids' => ['nullable', 'array'],
            'free_service_ids.*' => ['integer', 'exists:services,id'],
            'priority_booking' => ['nullable', 'boolean'],
            'points_multiplier' => ['nullable', 'numeric', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ]);

        $plan = $this->memberships->updatePlan($membershipPlan, $data);

        return response()->json(['data' => $this->memberships->formatPlan($plan)]);
    }

    public function destroy(Request $request, string $tenantSlug, MembershipPlan $membershipPlan): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);
        abort_unless($membershipPlan->tenant_id === $tenant->id, 404);

        $this->memberships->deletePlan($membershipPlan);

        return response()->json(['message' => 'Membership plan archived.']);
    }

    public function memberships(Request $request, string $tenantSlug): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);
        $filters = $request->validate([
            'client_user_id' => ['nullable', 'integer', 'exists:users,id'],
            'status' => ['nullable', 'string', Rule::in(array_column(ClientMembershipStatus::cases(), 'value'))],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        $paginator = $this->memberships->listClientMemberships($tenant->id, $filters, (int) ($filters['per_page'] ?? 20));

        return response()->json([
            'data' => collect($paginator->items())->map(fn (ClientMembership $membership) => $this->memberships->formatMembership($membership)),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }

    public function assign(Request $request, string $tenantSlug): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);
        $data = $request->validate([
            'membership_plan_id' => ['required', 'integer', 'exists:membership_plans,id'],
            'client_user_id' => ['required', 'integer', 'exists:users,id'],
            'status' => ['nullable', 'string', Rule::in(array_column(ClientMembershipStatus::cases(), 'value'))],
            'starts_at' => ['nullable', 'date'],
            'ends_at' => ['nullable', 'date'],
            'next_billing_at' => ['nullable', 'date'],
            'sale_id' => ['nullable', 'integer', 'exists:sales,id'],
        ]);

        $membership = $this->memberships->assignMembership($tenant->id, $data, $request->user());

        return response()->json(['data' => $this->memberships->formatMembership($membership)], 201);
    }
}
