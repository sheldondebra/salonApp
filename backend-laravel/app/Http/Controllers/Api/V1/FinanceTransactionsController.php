<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\FinanceTransactionsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class FinanceTransactionsController extends Controller
{
  public function __construct(
    private readonly FinanceTransactionsService $transactions,
  ) {}

  public function index(Request $request, string $tenantSlug): JsonResponse
  {
    $this->authorize('viewFinance');

    /** @var \App\Models\Tenant $tenant */
    $tenant = $request->attributes->get('tenant');
    abort_unless($tenant->slug === $tenantSlug, 404);

    $filters = $request->validate([
      'from' => ['nullable', 'date'],
      'to' => ['nullable', 'date', 'after_or_equal:from'],
      'status' => ['nullable', 'string', 'max:32'],
      'source_type' => ['nullable', 'string', 'max:32'],
      'payment_method' => ['nullable', 'string', 'max:64'],
      'q' => ['nullable', 'string', 'max:100'],
      'page' => ['nullable', 'integer', 'min:1'],
      'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
    ]);

    $payload = $this->transactions->paginate(
      $tenant->id,
      $filters,
      (int) ($filters['page'] ?? 1),
      (int) ($filters['per_page'] ?? 25),
    );

    return response()->json($payload);
  }

  public function export(Request $request, string $tenantSlug): StreamedResponse
  {
    $this->authorize('viewFinance');

    /** @var \App\Models\Tenant $tenant */
    $tenant = $request->attributes->get('tenant');
    abort_unless($tenant->slug === $tenantSlug, 404);

    $filters = $request->validate([
      'from' => ['nullable', 'date'],
      'to' => ['nullable', 'date', 'after_or_equal:from'],
      'status' => ['nullable', 'string', 'max:32'],
      'source_type' => ['nullable', 'string', 'max:32'],
      'payment_method' => ['nullable', 'string', 'max:64'],
      'q' => ['nullable', 'string', 'max:100'],
    ]);

    $rows = $this->transactions->exportRows($tenant->id, $filters);
    $filename = "finance-transactions-{$tenant->slug}-".now()->format('Y-m-d').'.csv';

    return response()->streamDownload(function () use ($rows) {
      $handle = fopen('php://output', 'w');
      fputcsv($handle, [
        'occurred_at',
        'source_type',
        'transaction_type',
        'status',
        'payment_method',
        'amount_cents',
        'currency',
        'reference',
        'description',
        'customer_name',
        'branch_name',
      ]);

      foreach ($rows as $row) {
        fputcsv($handle, [
          $row['occurred_at'] ?? '',
          $row['source_type'] ?? '',
          $row['transaction_type'] ?? '',
          $row['status'] ?? '',
          $row['payment_method'] ?? '',
          $row['amount_cents'] ?? 0,
          $row['currency'] ?? '',
          $row['reference'] ?? '',
          $row['description'] ?? '',
          $row['customer_name'] ?? '',
          $row['branch_name'] ?? '',
        ]);
      }

      fclose($handle);
    }, $filename, [
      'Content-Type' => 'text/csv',
    ]);
  }
}
