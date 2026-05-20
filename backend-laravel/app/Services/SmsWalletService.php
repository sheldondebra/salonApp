<?php

namespace App\Services;

use App\Enums\SmsWalletTransactionType;
use App\Models\SmsWalletTransaction;
use App\Models\Tenant;
use App\Models\TenantSmsWallet;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class SmsWalletService
{
    public function walletFor(int $tenantId): TenantSmsWallet
    {
        return TenantSmsWallet::query()->firstOrCreate(
            ['tenant_id' => $tenantId],
            [
                'balance_credits' => 0,
                'low_balance_threshold' => 100,
            ]
        );
    }

    public function balance(int $tenantId): int
    {
        return (int) $this->walletFor($tenantId)->balance_credits;
    }

    public function canSend(int $tenantId, int $credits = 1): bool
    {
        return $this->balance($tenantId) >= $credits;
    }

    /**
     * @param  array<string, mixed>  $meta
     */
    public function credit(
        int $tenantId,
        int $credits,
        SmsWalletTransactionType $type,
        ?string $notes = null,
        ?int $performedByUserId = null,
        ?string $referenceType = null,
        ?int $referenceId = null,
        array $meta = [],
    ): SmsWalletTransaction {
        if ($credits < 1) {
            throw new InvalidArgumentException('Credit amount must be at least 1.');
        }

        return DB::transaction(function () use ($tenantId, $credits, $type, $notes, $performedByUserId, $referenceType, $referenceId, $meta) {
            $wallet = TenantSmsWallet::query()->lockForUpdate()->firstOrCreate(
                ['tenant_id' => $tenantId],
                ['low_balance_threshold' => 100]
            );

            $wallet->balance_credits = (int) $wallet->balance_credits + $credits;

            if ($type === SmsWalletTransactionType::Purchase) {
                $wallet->total_purchased = (int) $wallet->total_purchased + $credits;
            } elseif (in_array($type, [SmsWalletTransactionType::Allocation, SmsWalletTransactionType::Bonus, SmsWalletTransactionType::Correction], true)) {
                $wallet->total_allocated = (int) $wallet->total_allocated + $credits;
            }

            $wallet->save();

            return $this->recordTransaction(
                $wallet,
                $type,
                $credits,
                $notes,
                $performedByUserId,
                $referenceType,
                $referenceId,
                null,
                $meta
            );
        });
    }

    /**
     * @param  array<string, mixed>  $meta
     */
    public function debit(
        int $tenantId,
        int $credits,
        SmsWalletTransactionType $type,
        ?string $notes = null,
        ?int $smsMessageId = null,
        array $meta = [],
    ): SmsWalletTransaction {
        if ($credits < 1) {
            throw new InvalidArgumentException('Debit amount must be at least 1.');
        }

        return DB::transaction(function () use ($tenantId, $credits, $type, $notes, $smsMessageId, $meta) {
            $wallet = TenantSmsWallet::query()->lockForUpdate()->where('tenant_id', $tenantId)->firstOrFail();

            if ((int) $wallet->balance_credits < $credits) {
                throw new InvalidArgumentException('Insufficient SMS credits.');
            }

            $wallet->balance_credits = (int) $wallet->balance_credits - $credits;
            $wallet->total_used = (int) $wallet->total_used + $credits;
            $wallet->save();

            return $this->recordTransaction(
                $wallet,
                $type,
                -$credits,
                $notes,
                null,
                null,
                null,
                $smsMessageId,
                $meta
            );
        });
    }

    public function ensureWalletsForAllTenants(): void
    {
        Tenant::query()->pluck('id')->each(fn (int $id) => $this->walletFor($id));
    }

    /**
     * @param  array<string, mixed>  $meta
     */
    protected function recordTransaction(
        TenantSmsWallet $wallet,
        SmsWalletTransactionType $type,
        int $signedAmount,
        ?string $notes,
        ?int $performedByUserId,
        ?string $referenceType,
        ?int $referenceId,
        ?int $smsMessageId,
        array $meta,
    ): SmsWalletTransaction {
        return SmsWalletTransaction::query()->create([
            'tenant_id' => $wallet->tenant_id,
            'type' => $type,
            'amount' => $signedAmount,
            'balance_after' => $wallet->balance_credits,
            'reference_type' => $referenceType,
            'reference_id' => $referenceId,
            'sms_message_id' => $smsMessageId,
            'performed_by_user_id' => $performedByUserId,
            'notes' => $notes,
            'meta' => $meta ?: null,
            'created_at' => now(),
        ]);
    }
}
