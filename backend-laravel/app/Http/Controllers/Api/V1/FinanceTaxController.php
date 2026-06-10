<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\TaxAppliesTo;
use App\Enums\TaxMode;
use App\Http\Controllers\Api\V1\Concerns\ResolvesTenantFromRequest;
use App\Http\Controllers\Controller;
use App\Models\TenantTaxRate;
use App\Services\FinanceTaxReportService;
use App\Services\TenantTaxRateService;
use App\Support\PermissionChecker;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\StreamedResponse;

class FinanceTaxController extends Controller
{
    use ResolvesTenantFromRequest;

    public function __construct(
        private readonly TenantTaxRateService $taxRates,
        private readonly FinanceTaxReportService $reports,
    ) {}

    public function rates(Request $request, string $tenantSlug): JsonResponse
    {
        $this->authorize('viewFinance');
        $tenant = $this->tenant($request, $tenantSlug);

        return response()->json([
            'data' => collect($this->taxRates->list($tenant->id))
                ->map(fn (TenantTaxRate $rate) => $this->taxRates->formatRate($rate))
                ->values(),
        ]);
    }

    public function storeRate(Request $request, string $tenantSlug): JsonResponse
    {
        $this->authorizeManageTaxes($request);
        $tenant = $this->tenant($request, $tenantSlug);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'rate' => ['required', 'numeric', 'min:0', 'max:100'],
            'applies_to' => ['nullable', 'string', Rule::in(TaxAppliesTo::values())],
            'inclusive_or_exclusive' => ['nullable', 'string', Rule::in(TaxMode::values())],
            'is_active' => ['sometimes', 'boolean'],
            'is_default' => ['sometimes', 'boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ]);

        $rate = $this->taxRates->create($tenant->id, $data);

        return response()->json(['data' => $this->taxRates->formatRate($rate)], 201);
    }

    public function updateRate(Request $request, string $tenantSlug, TenantTaxRate $taxRate): JsonResponse
    {
        $this->authorizeManageTaxes($request);
        $tenant = $this->tenant($request, $tenantSlug);
        abort_unless($taxRate->tenant_id === $tenant->id, 404);

        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:120'],
            'rate' => ['sometimes', 'numeric', 'min:0', 'max:100'],
            'applies_to' => ['sometimes', 'string', Rule::in(TaxAppliesTo::values())],
            'inclusive_or_exclusive' => ['sometimes', 'string', Rule::in(TaxMode::values())],
            'is_active' => ['sometimes', 'boolean'],
            'is_default' => ['sometimes', 'boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ]);

        $rate = $this->taxRates->update($taxRate, $tenant->id, $data);

        return response()->json(['data' => $this->taxRates->formatRate($rate)]);
    }

    public function preview(Request $request, string $tenantSlug): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);

        $data = $request->validate([
            'lines' => ['required', 'array', 'min:1'],
            'lines.*.type' => ['required', 'string', Rule::in(['service', 'product', 'addon'])],
            'lines.*.amount_cents' => ['required', 'integer', 'min:0'],
        ]);

        return response()->json([
            'data' => $this->taxRates->calculateForLines($tenant->id, $data['lines']),
        ]);
    }

    public function report(Request $request, string $tenantSlug): JsonResponse
    {
        $this->authorize('viewFinance');
        $tenant = $this->tenant($request, $tenantSlug);

        $filters = $request->validate([
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date', 'after_or_equal:from'],
            'location_id' => ['nullable', 'integer'],
        ]);

        return response()->json([
            'data' => $this->reports->report($tenant->id, $filters),
        ]);
    }

    public function exportReport(Request $request, string $tenantSlug): StreamedResponse
    {
        $this->authorize('viewFinance');
        $tenant = $this->tenant($request, $tenantSlug);

        $filters = $request->validate([
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date', 'after_or_equal:from'],
            'location_id' => ['nullable', 'integer'],
        ]);

        $rows = $this->reports->exportRows($tenant->id, $filters);
        $filename = "finance-tax-report-{$tenant->slug}-".now()->format('Y-m-d').'.csv';

        return response()->streamDownload(function () use ($rows) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, ['source', 'label', 'tax_cents', 'taxable_cents', 'count', 'period_from', 'period_to']);
            foreach ($rows as $row) {
                fputcsv($handle, [
                    $row['source'],
                    $row['label'],
                    $row['tax_cents'],
                    $row['taxable_cents'],
                    $row['count'],
                    $row['period_from'],
                    $row['period_to'],
                ]);
            }
            fclose($handle);
        }, $filename, ['Content-Type' => 'text/csv']);
    }

    protected function authorizeManageTaxes(Request $request): void
    {
        $user = $request->user();
        abort_unless(
            PermissionChecker::allows($user, 'finance.taxes.manage')
                || PermissionChecker::allows($user, 'settings.manage'),
            403
        );
    }
}
