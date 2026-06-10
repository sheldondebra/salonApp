<?php

namespace App\Services;

use App\Enums\PaymentRequestStatus;
use App\Enums\SaleStatus;
use App\Enums\WalletTransactionDirection;
use App\Models\PaymentRequest;
use App\Models\PaymentTransaction;
use App\Models\Sale;
use App\Models\TenantWalletTransaction;
use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Pagination\LengthAwarePaginator as Paginator;
use Illuminate\Support\Collection;

class FinanceTransactionsService
{
  public function __construct(
    private readonly TenantWalletService $wallets,
    private readonly TenantFinanceRefundService $refunds,
    private readonly TenantFinanceAdjustmentService $adjustments,
  ) {}

  /**
   * @param  array<string, mixed>  $filters
   * @return array{data: list<array<string, mixed>>, meta: array<string, mixed>}
   */
  public function paginate(int $tenantId, array $filters = [], int $page = 1, int $perPage = 25): array
  {
    $perPage = max(1, min($perPage, 100));
    $page = max(1, $page);
    $rows = $this->collectRows($tenantId, $filters);
    $paginator = $this->paginateCollection($rows, $perPage, $page);

    return [
      'data' => $paginator->items(),
      'meta' => [
        'current_page' => $paginator->currentPage(),
        'last_page' => $paginator->lastPage(),
        'per_page' => $paginator->perPage(),
        'total' => $paginator->total(),
        'summary' => $this->summarize($rows),
      ],
    ];
  }

  /** @return list<array<string, mixed>> */
  public function exportRows(int $tenantId, array $filters = []): array
  {
    return $this->collectRows($tenantId, $filters)->values()->all();
  }

  /** @param  array<string, mixed>  $filters */
  private function collectRows(int $tenantId, array $filters): Collection
  {
    $from = ! empty($filters['from']) ? Carbon::parse($filters['from'])->startOfDay() : now()->subDays(89)->startOfDay();
    $to = ! empty($filters['to']) ? Carbon::parse($filters['to'])->endOfDay() : now()->endOfDay();
    $status = $filters['status'] ?? null;
    $sourceType = $filters['source_type'] ?? null;
    $paymentMethod = $filters['payment_method'] ?? null;
    $search = isset($filters['q']) ? trim((string) $filters['q']) : '';

    $rows = collect()
      ->merge($this->paymentTransactionRows($tenantId, $from, $to))
      ->merge($this->paymentRequestRows($tenantId, $from, $to))
      ->merge($this->posSaleRows($tenantId, $from, $to))
      ->merge($this->walletRows($tenantId, $from, $to))
      ->merge(collect($this->refunds->ledgerRows($tenantId, $from, $to)))
      ->merge(collect($this->adjustments->ledgerRows($tenantId, $from, $to)));

    return $rows
      ->filter(function (array $row) use ($status, $sourceType, $paymentMethod, $search) {
        if ($status && ($row['status'] ?? null) !== $status) {
          return false;
        }
        if ($sourceType && ($row['source_type'] ?? null) !== $sourceType) {
          return false;
        }
        if ($paymentMethod && ($row['payment_method'] ?? null) !== $paymentMethod) {
          return false;
        }
        if ($search !== '') {
          $haystack = mb_strtolower(implode(' ', array_filter([
            $row['reference'] ?? '',
            $row['description'] ?? '',
            $row['customer_name'] ?? '',
            $row['branch_name'] ?? '',
          ])));

          if (! str_contains($haystack, mb_strtolower($search))) {
            return false;
          }
        }

        return true;
      })
      ->sortByDesc('occurred_at')
      ->values();
  }

  /** @return Collection<int, array<string, mixed>> */
  private function paymentTransactionRows(int $tenantId, Carbon $from, Carbon $to): Collection
  {
    return PaymentTransaction::query()
      ->withoutGlobalScope('tenant')
      ->where('tenant_id', $tenantId)
      ->where(function ($query) use ($from, $to) {
        $query->whereBetween('paid_at', [$from, $to])
          ->orWhere(function ($inner) use ($from, $to) {
            $inner->whereNull('paid_at')->whereBetween('created_at', [$from, $to]);
          });
      })
      ->with([
        'user:id,name',
        'appointment.service:id,name',
        'appointment.staffMember:id,display_name',
        'appointment.location:id,name',
        'sale:id,sale_number,location_id',
        'sale.location:id,name',
      ])
      ->latest('created_at')
      ->limit(500)
      ->get()
      ->map(function (PaymentTransaction $row) {
        $sourceType = $row->sale_id ? 'pos_sale' : ($row->appointment_id ? 'booking' : 'payment');
        $isRefund = str_contains(strtolower((string) $row->status), 'refund');

        return [
          'id' => 'payment_transaction:'.$row->id,
          'source_type' => $sourceType,
          'source_id' => $row->id,
          'transaction_type' => $isRefund ? 'refund' : 'income',
          'payment_method' => $this->labelPaymentMethod((string) ($row->provider ?? 'gateway')),
          'gateway' => $row->provider,
          'amount_cents' => (int) $row->amount_cents,
          'currency' => $row->currency ?? 'GHS',
          'status' => $row->status,
          'reference' => $row->provider_reference ?? $row->uuid,
          'description' => $this->paymentDescription($row),
          'customer_name' => $row->user?->name,
          'branch_name' => $row->appointment?->location?->name ?? $row->sale?->location?->name,
          'staff_name' => $row->appointment?->staffMember?->display_name,
          'occurred_at' => ($row->paid_at ?? $row->created_at)?->toIso8601String(),
        ];
      });
  }

  /** @return Collection<int, array<string, mixed>> */
  private function paymentRequestRows(int $tenantId, Carbon $from, Carbon $to): Collection
  {
    return PaymentRequest::query()
      ->where('tenant_id', $tenantId)
      ->whereBetween('created_at', [$from, $to])
      ->with(['customer:id,name', 'branch:id,name'])
      ->latest('created_at')
      ->limit(500)
      ->get()
      ->map(function (PaymentRequest $row) {
        return [
          'id' => 'payment_request:'.$row->id,
          'source_type' => 'payment_request',
          'source_id' => $row->id,
          'transaction_type' => 'income',
          'payment_method' => $this->labelPaymentMethod((string) ($row->payment_channel ?: $row->gateway)),
          'gateway' => $row->gateway,
          'amount_cents' => (int) $row->amount_cents,
          'currency' => $row->currency ?? 'GHS',
          'status' => $this->mapPaymentRequestStatus($row->status),
          'reference' => $row->reference,
          'description' => $row->description ?: ucfirst(str_replace('_', ' ', (string) ($row->reason?->value ?? $row->reason ?? 'payment'))),
          'customer_name' => $row->customer?->name,
          'branch_name' => $row->branch?->name,
          'staff_name' => null,
          'occurred_at' => ($row->paid_at ?? $row->created_at)?->toIso8601String(),
        ];
      });
  }

  /** @return Collection<int, array<string, mixed>> */
  private function posSaleRows(int $tenantId, Carbon $from, Carbon $to): Collection
  {
    return Sale::query()
      ->where('tenant_id', $tenantId)
      ->where('status', SaleStatus::Completed)
      ->whereBetween('completed_at', [$from, $to])
      ->whereDoesntHave('payment', fn ($q) => $q->where('status', 'paid'))
      ->with(['location:id,name', 'client:id,name'])
      ->latest('completed_at')
      ->limit(500)
      ->get()
      ->map(function (Sale $row) {
        return [
          'id' => 'pos_sale:'.$row->id,
          'source_type' => 'pos_sale',
          'source_id' => $row->id,
          'transaction_type' => 'income',
          'payment_method' => $this->labelPaymentMethod((string) ($row->payment_method ?? 'cash')),
          'gateway' => null,
          'amount_cents' => (int) $row->total_cents,
          'currency' => $row->currency ?? 'GHS',
          'status' => 'paid',
          'reference' => $row->sale_number ?? $row->uuid,
          'description' => 'POS sale '.$row->sale_number,
          'customer_name' => $row->client?->name,
          'branch_name' => $row->location?->name,
          'staff_name' => null,
          'occurred_at' => $row->completed_at?->toIso8601String(),
        ];
      });
  }

  /** @return Collection<int, array<string, mixed>> */
  private function walletRows(int $tenantId, Carbon $from, Carbon $to): Collection
  {
    $wallet = $this->wallets->walletFor($tenantId);

    return TenantWalletTransaction::query()
      ->where('wallet_id', $wallet->id)
      ->whereBetween('created_at', [$from, $to])
      ->with('createdBy:id,name')
      ->latest('created_at')
      ->limit(500)
      ->get()
      ->map(function (TenantWalletTransaction $row) {
        $direction = $row->direction instanceof WalletTransactionDirection
          ? $row->direction->value
          : (string) $row->direction;
        $isCredit = $direction === WalletTransactionDirection::Credit->value;

        return [
          'id' => 'wallet:'.$row->id,
          'source_type' => 'wallet',
          'source_id' => $row->id,
          'transaction_type' => $isCredit ? 'income' : 'expense',
          'payment_method' => 'Wallet',
          'gateway' => null,
          'amount_cents' => (int) $row->amount,
          'currency' => 'GHS',
          'status' => 'posted',
          'reference' => $row->reference,
          'description' => $row->description ?: ucfirst(str_replace('_', ' ', (string) ($row->type?->value ?? $row->type ?? 'wallet'))),
          'customer_name' => $row->createdBy?->name,
          'branch_name' => null,
          'staff_name' => null,
          'occurred_at' => $row->created_at?->toIso8601String(),
        ];
      });
  }

  private function paymentDescription(PaymentTransaction $row): string
  {
    if ($row->appointment?->service?->name) {
      return 'Booking payment · '.$row->appointment->service->name;
    }
    if ($row->sale_id) {
      return 'POS payment · '.($row->sale?->sale_number ?? 'Sale');
    }

    return ucfirst(str_replace('_', ' ', (string) ($row->purpose?->value ?? $row->purpose ?? 'payment')));
  }

  private function mapPaymentRequestStatus(PaymentRequestStatus|string|null $status): string
  {
    $value = $status instanceof PaymentRequestStatus ? $status->value : (string) $status;

    return match ($value) {
      PaymentRequestStatus::Success->value => 'paid',
      PaymentRequestStatus::Pending->value, PaymentRequestStatus::Processing->value => 'pending',
      PaymentRequestStatus::Failed->value => 'failed',
      PaymentRequestStatus::Expired->value => 'expired',
      PaymentRequestStatus::Cancelled->value => 'cancelled',
      default => $value,
    };
  }

  private function labelPaymentMethod(string $raw): string
  {
    return match (strtolower($raw)) {
      'cash' => 'Cash',
      'card' => 'Card',
      'mobile_money', 'mtn_momo', 'momo' => 'Mobile money',
      'paystack' => 'Paystack',
      'flutterwave' => 'Flutterwave',
      'ussd' => 'USSD',
      'wallet' => 'Wallet',
      default => ucfirst(str_replace('_', ' ', $raw)),
    };
  }

  /** @param  Collection<int, array<string, mixed>>  $rows */
  private function summarize(Collection $rows): array
  {
    $income = $rows->where('transaction_type', 'income')->sum('amount_cents');
    $expense = $rows->where('transaction_type', 'expense')->sum('amount_cents');
    $refunds = $rows->where('transaction_type', 'refund')->sum('amount_cents');

    return [
      'total_count' => $rows->count(),
      'income_cents' => (int) $income,
      'expense_cents' => (int) $expense,
      'refund_cents' => (int) $refunds,
      'net_cents' => (int) ($income - $expense - $refunds),
      'paid_count' => $rows->where('status', 'paid')->count(),
      'pending_count' => $rows->where('status', 'pending')->count(),
      'failed_count' => $rows->where('status', 'failed')->count(),
    ];
  }

  /** @param  Collection<int, array<string, mixed>>  $items */
  private function paginateCollection(Collection $items, int $perPage, int $page): LengthAwarePaginator
  {
    $total = $items->count();
    $slice = $items->forPage($page, $perPage)->values()->all();

    return new Paginator($slice, $total, $perPage, $page, [
      'path' => Paginator::resolveCurrentPath(),
    ]);
  }
}
