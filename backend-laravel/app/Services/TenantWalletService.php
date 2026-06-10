<?php

namespace App\Services;

use App\Enums\WalletStatus;
use App\Enums\WalletTransactionDirection;
use App\Enums\WalletTransactionType;
use App\Models\Tenant;
use App\Models\TenantWallet;
use App\Models\TenantWalletTransaction;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use InvalidArgumentException;

class TenantWalletService
{
    public function walletFor(Tenant|int $tenant, ?string $currency = null): TenantWallet
    {
        $tenantId = $tenant instanceof Tenant ? $tenant->id : $tenant;
        $tenantModel = $tenant instanceof Tenant ? $tenant : Tenant::query()->findOrFail($tenantId);
        $currency ??= $tenantModel->currency ?: 'GHS';

        return TenantWallet::query()->firstOrCreate(
            ['tenant_id' => $tenantId],
            [
                'currency' => strtoupper($currency),
                'status' => WalletStatus::Active->value,
            ]
        );
    }

    /**
     * @param  array<string, mixed>  $metadata
     */
    public function applyLedgerEntry(
        TenantWallet $wallet,
        WalletTransactionType $type,
        WalletTransactionDirection $direction,
        int $amountCents,
        string $reference,
        ?string $description = null,
        ?int $paymentRequestId = null,
        ?int $settlementId = null,
        ?int $createdByUserId = null,
        array $metadata = [],
        bool $allowNegativeAvailable = false,
    ): TenantWalletTransaction {
        if ($amountCents < 1) {
            throw new InvalidArgumentException('Amount must be at least 1 cent.');
        }

        if ($reference === '') {
            throw new InvalidArgumentException('Reference is required for wallet ledger entries.');
        }

        return DB::transaction(function () use (
            $wallet,
            $type,
            $direction,
            $amountCents,
            $reference,
            $description,
            $paymentRequestId,
            $settlementId,
            $createdByUserId,
            $metadata,
            $allowNegativeAvailable,
        ) {
            $existing = TenantWalletTransaction::query()
                ->where('tenant_id', $wallet->tenant_id)
                ->where('reference', $reference)
                ->first();

            if ($existing) {
                return $existing;
            }

            $locked = TenantWallet::query()->lockForUpdate()->findOrFail($wallet->id);

            if ($locked->status === WalletStatus::Frozen) {
                throw ValidationException::withMessages(['wallet' => 'Wallet is frozen.']);
            }

            $balanceBefore = (int) $locked->available_balance + (int) $locked->pending_balance;

            match ($type) {
                WalletTransactionType::PaymentCollected => $this->applyPaymentCollected($locked, $amountCents),
                WalletTransactionType::PlatformFee, WalletTransactionType::GatewayFee => $this->applyFee($locked, $amountCents),
                WalletTransactionType::SettlementPaid => $this->applySettlementPaid($locked, $amountCents, $allowNegativeAvailable),
                WalletTransactionType::Refund => $this->applyRefund($locked, $amountCents, $allowNegativeAvailable),
                WalletTransactionType::Adjustment => $direction === WalletTransactionDirection::Credit
                    ? $this->applyCreditAvailable($locked, $amountCents)
                    : $this->applyDebitAvailable($locked, $amountCents, $allowNegativeAvailable),
                default => throw new InvalidArgumentException("Unsupported wallet transaction type: {$type->value}"),
            };

            $locked->save();

            $balanceAfter = (int) $locked->available_balance + (int) $locked->pending_balance;

            return TenantWalletTransaction::query()->create([
                'tenant_id' => $locked->tenant_id,
                'wallet_id' => $locked->id,
                'payment_request_id' => $paymentRequestId,
                'settlement_id' => $settlementId,
                'type' => $type,
                'direction' => $direction,
                'amount' => $amountCents,
                'balance_before' => $balanceBefore,
                'balance_after' => $balanceAfter,
                'reference' => $reference,
                'description' => $description,
                'metadata' => $metadata ?: null,
                'created_by_user_id' => $createdByUserId,
                'created_at' => now(),
            ]);
        });
    }

    protected function applyPaymentCollected(TenantWallet $wallet, int $amountCents): void
    {
        $wallet->pending_balance = (int) $wallet->pending_balance + $amountCents;
        $wallet->total_collected = (int) $wallet->total_collected + $amountCents;
    }

    protected function applyFee(TenantWallet $wallet, int $amountCents): void
    {
        $pending = (int) $wallet->pending_balance;
        $deduct = min($pending, $amountCents);
        $wallet->pending_balance = $pending - $deduct;
        $wallet->total_fees = (int) $wallet->total_fees + $amountCents;
    }

    protected function applySettlementPaid(TenantWallet $wallet, int $amountCents, bool $allowNegative): void
    {
        $this->applyDebitAvailable($wallet, $amountCents, $allowNegative);
        $wallet->total_settled = (int) $wallet->total_settled + $amountCents;
    }

    protected function applyRefund(TenantWallet $wallet, int $amountCents, bool $allowNegative): void
    {
        $this->applyDebitAvailable($wallet, $amountCents, $allowNegative);
        $wallet->total_refunded = (int) $wallet->total_refunded + $amountCents;
    }

    protected function applyCreditAvailable(TenantWallet $wallet, int $amountCents): void
    {
        $wallet->available_balance = (int) $wallet->available_balance + $amountCents;
    }

    protected function applyDebitAvailable(TenantWallet $wallet, int $amountCents, bool $allowNegative): void
    {
        $available = (int) $wallet->available_balance;
        if (! $allowNegative && $available < $amountCents) {
            throw ValidationException::withMessages(['amount' => 'Insufficient available wallet balance.']);
        }
        $wallet->available_balance = $available - $amountCents;
    }

    /**
     * @param  array<string, mixed>  $metadata
     */
    public function adminAdjust(
        TenantWallet $wallet,
        WalletTransactionDirection $direction,
        int $amountCents,
        string $reference,
        ?string $description,
        int $adminUserId,
        array $metadata = [],
    ): TenantWalletTransaction {
        return $this->applyLedgerEntry(
            $wallet,
            WalletTransactionType::Adjustment,
            $direction,
            $amountCents,
            $reference,
            $description,
            null,
            null,
            $adminUserId,
            $metadata,
            allowNegativeAvailable: true,
        );
    }
}
