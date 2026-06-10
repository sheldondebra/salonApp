<?php

namespace App\Services;

use App\Enums\CashDrawerSessionStatus;
use App\Enums\SaleStatus;
use App\Models\CashDrawerSession;
use App\Models\Sale;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CashDrawerService
{
    public function activeSession(int $tenantId, int $locationId): ?CashDrawerSession
    {
        return CashDrawerSession::query()
            ->where('tenant_id', $tenantId)
            ->where('location_id', $locationId)
            ->where('status', CashDrawerSessionStatus::Open)
            ->with(['location:id,name', 'openedBy:id,name'])
            ->first();
    }

    /** @param  array<string, mixed>  $filters */
    public function paginate(int $tenantId, array $filters = [], int $perPage = 20): LengthAwarePaginator
    {
        $query = CashDrawerSession::query()
            ->where('tenant_id', $tenantId)
            ->with(['location:id,name', 'openedBy:id,name', 'closedBy:id,name']);

        if (! empty($filters['location_id'])) {
            $query->where('location_id', (int) $filters['location_id']);
        }

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (! empty($filters['from'])) {
            $query->whereDate('opened_at', '>=', $filters['from']);
        }

        if (! empty($filters['to'])) {
            $query->whereDate('opened_at', '<=', $filters['to']);
        }

        return $query
            ->orderByDesc('opened_at')
            ->paginate(min(max($perPage, 1), 100));
    }

  /** @param  array<string, mixed>  $data */
    public function open(int $tenantId, array $data, User $user): CashDrawerSession
    {
        $locationId = (int) $data['location_id'];

        if ($this->activeSession($tenantId, $locationId)) {
            throw ValidationException::withMessages([
                'location_id' => ['A cash drawer is already open at this location.'],
            ]);
        }

        return CashDrawerSession::query()->create([
            'tenant_id' => $tenantId,
            'location_id' => $locationId,
            'opened_by_user_id' => $user->id,
            'opening_cash_cents' => max(0, (int) ($data['opening_cash_cents'] ?? 0)),
            'expected_cash_cents' => max(0, (int) ($data['opening_cash_cents'] ?? 0)),
            'status' => CashDrawerSessionStatus::Open,
            'opening_notes' => $data['opening_notes'] ?? null,
            'opened_at' => now(),
        ])->fresh(['location:id,name', 'openedBy:id,name']);
    }

    /** @param  array<string, mixed>  $data */
    public function close(CashDrawerSession $session, array $data, User $user): CashDrawerSession
    {
        abort_unless($session->status === CashDrawerSessionStatus::Open, 422, 'Drawer is not open.');

        return DB::transaction(function () use ($session, $data, $user) {
            $breakdown = $this->salesBreakdown(
                $session->tenant_id,
                $session->location_id,
                $session->opened_at,
                now()
            );

            $cashSales = (int) ($breakdown['cash_cents'] ?? 0);
            $expectedCash = (int) $session->opening_cash_cents + $cashSales;
            $countedCash = max(0, (int) ($data['counted_cash_cents'] ?? 0));
            $difference = $countedCash - $expectedCash;

            $session->fill([
                'closed_by_user_id' => $user->id,
                'expected_cash_cents' => $expectedCash,
                'counted_cash_cents' => $countedCash,
                'difference_cents' => $difference,
                'payment_breakdown' => $breakdown,
                'closing_notes' => $data['closing_notes'] ?? null,
                'status' => $difference === 0
                    ? CashDrawerSessionStatus::Closed
                    : CashDrawerSessionStatus::Discrepancy,
                'closed_at' => now(),
            ]);
            $session->save();

            return $session->fresh(['location:id,name', 'openedBy:id,name', 'closedBy:id,name']);
        });
    }

    /** @return array<string, mixed> */
    public function liveSnapshot(CashDrawerSession $session): array
    {
        $breakdown = $this->salesBreakdown(
            $session->tenant_id,
            $session->location_id,
            $session->opened_at,
            now()
        );

        $cashSales = (int) ($breakdown['cash_cents'] ?? 0);
        $expectedCash = (int) $session->opening_cash_cents + $cashSales;

        return [
            'expected_cash_cents' => $expectedCash,
            'payment_breakdown' => $breakdown,
        ];
    }

    /** @return array<string, mixed> */
    public function formatSession(CashDrawerSession $session, bool $includeLive = false): array
    {
        $payload = [
            'uuid' => $session->uuid,
            'status' => $session->status?->value ?? $session->status,
            'location' => $session->location ? [
                'id' => $session->location->id,
                'name' => $session->location->name,
            ] : null,
            'opening_cash_cents' => (int) $session->opening_cash_cents,
            'expected_cash_cents' => (int) $session->expected_cash_cents,
            'counted_cash_cents' => $session->counted_cash_cents !== null ? (int) $session->counted_cash_cents : null,
            'difference_cents' => $session->difference_cents !== null ? (int) $session->difference_cents : null,
            'payment_breakdown' => $session->payment_breakdown ?? [],
            'opening_notes' => $session->opening_notes,
            'closing_notes' => $session->closing_notes,
            'opened_at' => $session->opened_at?->toIso8601String(),
            'closed_at' => $session->closed_at?->toIso8601String(),
            'opened_by' => $session->openedBy ? [
                'id' => $session->openedBy->id,
                'name' => $session->openedBy->name,
            ] : null,
            'closed_by' => $session->closedBy ? [
                'id' => $session->closedBy->id,
                'name' => $session->closedBy->name,
            ] : null,
        ];

        if ($includeLive && $session->status === CashDrawerSessionStatus::Open) {
            $live = $this->liveSnapshot($session);
            $payload['expected_cash_cents'] = $live['expected_cash_cents'];
            $payload['payment_breakdown'] = $live['payment_breakdown'];
        }

        return $payload;
    }

    /**
     * @return array{
     *   cash_cents: int,
     *   card_cents: int,
     *   mobile_money_cents: int,
     *   other_cents: int,
     *   total_sales_cents: int,
     *   sale_count: int
     * }
     */
    public function salesBreakdown(int $tenantId, int $locationId, $from, $to): array
    {
        $rows = Sale::query()
            ->where('tenant_id', $tenantId)
            ->where('location_id', $locationId)
            ->where('status', SaleStatus::Completed)
            ->whereBetween('completed_at', [$from, $to])
            ->select('payment_method', DB::raw('SUM(total_cents) as amount_cents'), DB::raw('COUNT(*) as sale_count'))
            ->groupBy('payment_method')
            ->get();

        $totals = [
            'cash_cents' => 0,
            'card_cents' => 0,
            'mobile_money_cents' => 0,
            'other_cents' => 0,
            'total_sales_cents' => 0,
            'sale_count' => 0,
        ];

        foreach ($rows as $row) {
            $amount = (int) $row->amount_cents;
            $count = (int) $row->sale_count;
            $method = strtolower((string) $row->payment_method);

            $totals['total_sales_cents'] += $amount;
            $totals['sale_count'] += $count;

            match ($method) {
                'cash' => $totals['cash_cents'] += $amount,
                'card' => $totals['card_cents'] += $amount,
                'mobile_money', 'momo', 'mtn_momo' => $totals['mobile_money_cents'] += $amount,
                default => $totals['other_cents'] += $amount,
            };
        }

        return $totals;
    }
}
