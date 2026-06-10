<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\V1\Concerns\ResolvesTenantFromRequest;
use App\Http\Controllers\Controller;
use App\Services\FinanceProfitLossService;
use App\Support\ReportFilters;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class FinanceProfitLossController extends Controller
{
    use ResolvesTenantFromRequest;

    public function __construct(
        private readonly FinanceProfitLossService $profitLoss,
    ) {}

    public function show(Request $request, string $tenantSlug): JsonResponse
    {
        $this->authorize('viewFinance');
        $tenant = $this->tenant($request, $tenantSlug);
        $filters = ReportFilters::fromRequest($request, $tenant->id);

        return response()->json([
            'data' => $this->profitLoss->statement($filters),
        ]);
    }

    public function export(Request $request, string $tenantSlug): StreamedResponse
    {
        $this->authorize('viewFinance');
        $tenant = $this->tenant($request, $tenantSlug);
        $filters = ReportFilters::fromRequest($request, $tenant->id);
        $rows = $this->profitLoss->exportRows($filters);
        $filename = "finance-profit-loss-{$tenant->slug}-".now()->format('Y-m-d').'.csv';

        return response()->streamDownload(function () use ($rows) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, ['section', 'label', 'amount_cents', 'period_from', 'period_to']);
            foreach ($rows as $row) {
                fputcsv($handle, [
                    $row['section'],
                    $row['label'],
                    $row['amount_cents'],
                    $row['period_from'],
                    $row['period_to'],
                ]);
            }
            fclose($handle);
        }, $filename, ['Content-Type' => 'text/csv']);
    }
}
