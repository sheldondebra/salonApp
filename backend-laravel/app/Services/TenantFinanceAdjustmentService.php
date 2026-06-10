<?php

namespace App\Services;

use App\Enums\FinanceAdjustmentDirection;
use App\Models\TenantFinanceAdjustment;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class TenantFinanceAdjustmentService
{
    /** @param  array<string, mixed>  $filters */
    public function paginate(int $tenantId, array $filters = [], int $perPage = 20): LengthAwarePaginator
    {
        $perPage = max(1, min($perPage, 100));

        $query = TenantFinanceAdjustment::query()
            ->where('tenant_id', $tenantId)
            ->with(['createdBy:id,name'])
            ->orderByDesc('created_at');

        if (! empty($filters['from'])) {
            $query->whereDate('created_at', '>=', $filters['from']);
        }
        if (! empty($filters['to'])) {
            $query->whereDate('created_at', '<=', $filters['to']);
        }

        return $query
            ->paginate($perPage)
            ->through(fn (TenantFinanceAdjustment $row) => $this->formatAdjustment($row));
    }

    /** @param  array<string, mixed>  $data */
    public function create(int $tenantId, array $data, User $user): TenantFinanceAdjustment
    {
        $amount = (int) $data['amount_cents'];
        if ($amount < 1) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'amount_cents' => ['Adjustment amount must be at least 1.'],
            ]);
        }

        return DB::transaction(function () use ($tenantId, $data, $user, $amount) {
            $adjustment = TenantFinanceAdjustment::query()->create([
                'tenant_id' => $tenantId,
                'ledger_reference' => $data['ledger_reference'],
                'source_type' => $data['source_type'] ?? null,
                'source_id' => isset($data['source_id']) ? (int) $data['source_id'] : null,
                'direction' => FinanceAdjustmentDirection::from($data['direction']),
                'amount_cents' => $amount,
                'currency' => $data['currency'] ?? 'GHS',
                'reason' => $data['reason'],
                'notes' => $data['notes'] ?? null,
                'created_by_user_id' => $user->id,
                'metadata' => [
                    'audit' => [
                        'action' => 'finance_adjustment_created',
                        'created_by' => $user->only(['id', 'name', 'email']),
                        'created_at' => now()->toIso8601String(),
                    ],
                ],
            ]);

            return $this->formatAdjustment($adjustment->fresh(['createdBy']));
        });
    }

    /** @return list<array<string, mixed>> */
    public function ledgerRows(int $tenantId, \Carbon\Carbon $from, \Carbon\Carbon $to): array
    {
        return TenantFinanceAdjustment::query()
            ->where('tenant_id', $tenantId)
            ->whereBetween('created_at', [$from, $to])
            ->orderByDesc('created_at')
            ->get()
            ->map(function (TenantFinanceAdjustment $row) {
                $isCredit = $row->direction === FinanceAdjustmentDirection::Credit;

                return [
                    'id' => 'finance_adjustment:'.$row->id,
                    'source_type' => $row->source_type ?? 'adjustment',
                    'source_id' => $row->source_id,
                    'transaction_type' => $isCredit ? 'income' : 'expense',
                    'status' => 'posted',
                    'amount_cents' => (int) $row->amount_cents,
                    'currency' => $row->currency,
                    'payment_method' => 'adjustment',
                    'reference' => $row->ledger_reference,
                    'description' => ($isCredit ? 'Credit adjustment' : 'Debit adjustment').' · '.$row->reason,
                    'customer_name' => null,
                    'branch_name' => null,
                    'occurred_at' => $row->created_at?->toIso8601String(),
                ];
            })
            ->values()
            ->all();
    }

    /** @return array<string, mixed> */
    public function formatAdjustment(TenantFinanceAdjustment $row): array
    {
        return [
            'id' => $row->id,
            'ledger_reference' => $row->ledger_reference,
            'source_type' => $row->source_type,
            'source_id' => $row->source_id,
            'direction' => $row->direction->value,
            'amount_cents' => (int) $row->amount_cents,
            'currency' => $row->currency,
            'reason' => $row->reason,
            'notes' => $row->notes,
            'created_at' => $row->created_at?->toIso8601String(),
            'created_by' => $row->createdBy ? ['id' => $row->createdBy->id, 'name' => $row->createdBy->name] : null,
        ];
    }
}
