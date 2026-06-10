<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\StaffMember;
use App\Services\StaffPayrollService;
use App\Support\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class StaffPayrollProfileController extends Controller
{
    public function __construct(
        protected StaffPayrollService $payroll,
    ) {}

    public function show(Request $request, string $tenantSlug, StaffMember $staffMember): JsonResponse
    {
        $this->authorizeStaff($staffMember);

        $profile = $this->payroll->profileForStaff($staffMember);

        return response()->json(['data' => $this->payroll->profilePayload($profile)]);
    }

    public function update(Request $request, string $tenantSlug, StaffMember $staffMember): JsonResponse
    {
        $this->authorizeStaff($staffMember);

        $validated = $request->validate([
            'pay_role_id' => ['nullable', 'integer', 'exists:staff_pay_roles,id'],
            'pay_type' => ['sometimes', Rule::in(['salary', 'hourly', 'commission', 'salary_commission', 'hourly_commission'])],
            'base_salary_cents' => ['sometimes', 'integer', 'min:0'],
            'hourly_rate_cents' => ['sometimes', 'integer', 'min:0'],
            'commission_rate' => ['sometimes', 'numeric', 'min:0', 'max:100'],
            'commission_type' => ['nullable', Rule::in(['percent_of_service', 'percent_of_revenue', 'flat_per_service'])],
            'tip_eligible' => ['sometimes', 'boolean'],
            'payout_method' => ['nullable', Rule::in(['momo', 'bank', 'cash', 'other'])],
            'payout_account_name' => ['nullable', 'string', 'max:255'],
            'payout_account_number' => ['nullable', 'string', 'max:64'],
            'effective_from' => ['nullable', 'date'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'is_active' => ['sometimes', 'boolean'],
            'apply_role_defaults' => ['sometimes', 'boolean'],
        ]);

        $profile = $this->payroll->profileForStaff($staffMember);

        if (! empty($validated['apply_role_defaults']) && ! empty($validated['pay_role_id'])) {
            $role = \App\Models\StaffPayRole::query()
                ->where('tenant_id', $staffMember->tenant_id)
                ->findOrFail($validated['pay_role_id']);
            $this->payroll->applyRoleDefaults($profile, $role);
            unset($validated['apply_role_defaults']);
        }

        $profile = $this->payroll->updateProfile($profile, $validated);

        return response()->json([
            'data' => $this->payroll->profilePayload($profile),
            'message' => 'Payroll profile saved.',
        ]);
    }

    private function authorizeStaff(StaffMember $staffMember): void
    {
        abort_if(TenantContext::id() !== $staffMember->tenant_id, 404);
    }
}
