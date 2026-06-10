<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\V1\Concerns\ResolvesTenantFromRequest;
use App\Http\Controllers\Controller;
use App\Services\FinancePrepaidBalanceService;
use App\Support\ReportFilters;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class FinancePrepaidBalanceController extends Controller
{
    use ResolvesTenantFromRequest;

    public function __construct(
        private readonly FinancePrepaidBalanceService $prepaid,
    ) {}

    public function show(Request $request, string $tenantSlug): JsonResponse
    {
        $this->authorize('viewFinance');
        $tenant = $this->tenant($request, $tenantSlug);
        $filters = ReportFilters::fromRequest($request, $tenant->id);

        return response()->json([
            'data' => $this->prepaid->report($filters),
        ]);
    }

    public function lookup(Request $request, string $tenantSlug): JsonResponse
    {
        $this->authorize('viewFinance');
        $tenant = $this->tenant($request, $tenantSlug);
        $data = $request->validate([
            'type' => ['required', 'string', 'in:gift_card,package'],
            'code' => ['nullable', 'string', 'max:32'],
            'balance_uuid' => ['nullable', 'string', 'max:64'],
        ]);

        return response()->json([
            'data' => $this->prepaid->lookup(
                $tenant->id,
                $data['type'],
                $data['code'] ?? null,
                $data['balance_uuid'] ?? null,
            ),
        ]);
    }

    public function export(Request $request, string $tenantSlug): StreamedResponse
    {
        $this->authorize('viewFinance');
        $tenant = $this->tenant($request, $tenantSlug);
        $filters = ReportFilters::fromRequest($request, $tenant->id);
        $rows = $this->prepaid->exportRows($filters);
        $filename = "finance-prepaid-balances-{$tenant->slug}-".now()->format('Y-m-d').'.csv';

        return response()->streamDownload(function () use ($rows) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, ['section', 'label', 'amount_cents', 'count']);
            foreach ($rows as $row) {
                fputcsv($handle, [
                    $row['section'],
                    $row['label'],
                    $row['amount_cents'],
                    $row['count'],
                ]);
            }
            fclose($handle);
        }, $filename, ['Content-Type' => 'text/csv']);
    }
}
