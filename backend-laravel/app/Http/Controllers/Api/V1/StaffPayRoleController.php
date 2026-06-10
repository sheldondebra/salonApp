<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\StaffMember;
use App\Models\StaffPayRole;
use App\Services\StaffPayrollService;
use App\Support\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class StaffPayRoleController extends Controller
{
    public function __construct(
        protected StaffPayrollService $payroll,
    ) {}

    public function index(Request $request, string $tenantSlug): JsonResponse
    {
        $tenant = TenantContext::id();

        $roles = StaffPayRole::query()
            ->where('tenant_id', $tenant)
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get()
            ->map(fn (StaffPayRole $role) => $this->payroll->rolePayload($role));

        return response()->json(['data' => $roles]);
    }

    public function store(Request $request, string $tenantSlug): JsonResponse
    {
        $tenant = TenantContext::id();
        $validated = $this->validateRole($request);

        $role = StaffPayRole::query()->create([
            ...$validated,
            'tenant_id' => $tenant,
        ]);

        return response()->json([
            'data' => $this->payroll->rolePayload($role),
            'message' => 'Pay role created.',
        ], 201);
    }

    public function update(Request $request, string $tenantSlug, StaffPayRole $payRole): JsonResponse
    {
        $this->assertTenant($payRole->tenant_id);
        $validated = $this->validateRole($request, true);

        $payRole->update($validated);

        return response()->json([
            'data' => $this->payroll->rolePayload($payRole->fresh()),
            'message' => 'Pay role updated.',
        ]);
    }

    public function destroy(Request $request, string $tenantSlug, StaffPayRole $payRole): JsonResponse
    {
        $this->assertTenant($payRole->tenant_id);
        $payRole->delete();

        return response()->json(['message' => 'Pay role removed.']);
    }

    /** @return array<string, mixed> */
    private function validateRole(Request $request, bool $partial = false): array
    {
        $rules = [
            'name' => [$partial ? 'sometimes' : 'required', 'string', 'max:120'],
            'description' => ['nullable', 'string', 'max:500'],
            'pay_type' => ['sometimes', Rule::in(['salary', 'hourly', 'commission', 'salary_commission', 'hourly_commission'])],
            'base_salary_cents' => ['sometimes', 'integer', 'min:0'],
            'hourly_rate_cents' => ['sometimes', 'integer', 'min:0'],
            'commission_rate' => ['sometimes', 'numeric', 'min:0', 'max:100'],
            'commission_type' => ['nullable', Rule::in(['percent_of_service', 'percent_of_revenue', 'flat_per_service'])],
            'tip_eligible' => ['sometimes', 'boolean'],
            'color' => ['nullable', 'string', 'max:16'],
            'sort_order' => ['sometimes', 'integer', 'min:0', 'max:9999'],
            'is_active' => ['sometimes', 'boolean'],
        ];

        return $request->validate($rules);
    }

    private function assertTenant(int $tenantId): void
    {
        abort_if(TenantContext::id() !== $tenantId, 404);
    }
}
