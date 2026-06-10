<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\V1\Concerns\ResolvesTenantFromRequest;
use App\Http\Controllers\Controller;
use App\Services\FinancePayrollService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class FinancePayrollController extends Controller
{
    use ResolvesTenantFromRequest;

    public function __construct(
        private readonly FinancePayrollService $payroll,
    ) {}

    public function index(Request $request, string $tenantSlug): JsonResponse
    {
        $this->authorizePayroll($request);
        $tenant = $this->tenant($request, $tenantSlug);

        $filters = $request->validate([
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date', 'after_or_equal:from'],
            'staff_member_id' => ['nullable', 'integer'],
        ]);

        $payload = $this->payroll->summary($tenant->id, $filters, $request->user());

        return response()->json(['data' => $payload]);
    }

    public function export(Request $request, string $tenantSlug): StreamedResponse
    {
        $this->authorizePayroll($request, export: true);
        $tenant = $this->tenant($request, $tenantSlug);

        $filters = $request->validate([
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date', 'after_or_equal:from'],
            'staff_member_id' => ['nullable', 'integer'],
        ]);

        $rows = $this->payroll->exportRows($tenant->id, $filters, $request->user());
        $filename = "finance-payroll-{$tenant->slug}-".now()->format('Y-m-d').'.csv';

        return response()->streamDownload(function () use ($rows) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, [
                'staff_name',
                'job_title',
                'pay_type',
                'pay_role',
                'base_pay_cents',
                'commission_cents',
                'tips_owed_cents',
                'total_earnings_cents',
                'approval_status',
            ]);
            foreach ($rows as $row) {
                fputcsv($handle, [
                    $row['staff_name'],
                    $row['job_title'],
                    $row['pay_type'],
                    $row['pay_role_name'],
                    $row['base_pay_cents'],
                    $row['commission_cents'],
                    $row['tips_owed_cents'],
                    $row['total_earnings_cents'],
                    $row['approval_status'],
                ]);
            }
            fclose($handle);
        }, $filename, [
            'Content-Type' => 'text/csv',
        ]);
    }

    protected function authorizePayroll(Request $request, bool $export = false): void
    {
        if ($export) {
            $this->authorize('viewFinance');

            return;
        }

        $user = $request->user();
        abort_unless($user, 401);

        if ($user->can('viewFinance') || $user->can('viewFinancePayroll')) {
            return;
        }

        $this->authorize('viewOwnFinancePayroll');
    }
}
