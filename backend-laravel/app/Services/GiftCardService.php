<?php

namespace App\Services;

use App\Enums\GiftCardTransactionType;
use App\Models\GiftCard;
use App\Models\GiftCardTransaction;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class GiftCardService
{
    public function paginateCards(int $tenantId, array $filters = [], int $perPage = 20): LengthAwarePaginator
    {
        $query = GiftCard::query()
            ->where('tenant_id', $tenantId)
            ->with(['transactions' => fn ($q) => $q->latest()->limit(10)])
            ->latest();

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (! empty($filters['q'])) {
            $term = '%'.$filters['q'].'%';
            $query->where(function ($q) use ($term) {
                $q->where('code', 'like', $term)
                    ->orWhere('recipient_name', 'like', $term)
                    ->orWhere('recipient_email', 'like', $term);
            });
        }

        return $query->paginate(min($perPage, 50));
    }

    public function sell(int $tenantId, array $data, ?User $actor = null): GiftCard
    {
        return DB::transaction(function () use ($tenantId, $data, $actor) {
            $code = strtoupper($data['code'] ?? Str::upper(Str::random(10)));
            $amount = (int) $data['amount_cents'];

            $card = GiftCard::query()->create([
                'tenant_id' => $tenantId,
                'code' => $code,
                'initial_balance_cents' => $amount,
                'balance_cents' => $amount,
                'status' => 'active',
                'recipient_email' => $data['recipient_email'] ?? null,
                'recipient_name' => $data['recipient_name'] ?? null,
                'purchaser_user_id' => $data['purchaser_user_id'] ?? $actor?->id,
                'client_user_id' => $data['client_user_id'] ?? null,
                'expires_at' => $data['expires_at'] ?? null,
                'sale_id' => $data['sale_id'] ?? null,
            ]);

            $this->recordTransaction($card, GiftCardTransactionType::Issued, $amount, $actor, $data['sale_id'] ?? null, 'Gift card sold');

            return $card->fresh('transactions');
        });
    }

    public function lookupByCode(int $tenantId, string $code): GiftCard
    {
        return GiftCard::query()
            ->where('tenant_id', $tenantId)
            ->where('code', strtoupper(trim($code)))
            ->with(['transactions' => fn ($q) => $q->latest()])
            ->firstOrFail();
    }

    public function redeem(GiftCard $card, int $amountCents, ?User $actor = null, ?int $saleId = null, ?string $note = null): GiftCard
    {
        if ($amountCents <= 0) {
            throw ValidationException::withMessages(['amount_cents' => ['Redeem amount must be greater than zero.']]);
        }

        if ($card->expires_at && $card->expires_at->isPast()) {
            $card->update(['status' => 'expired']);
            throw ValidationException::withMessages(['gift_card' => ['This gift card has expired.']]);
        }

        if ($card->balance_cents < $amountCents) {
            throw ValidationException::withMessages(['amount_cents' => ['Insufficient gift card balance.']]);
        }

        return DB::transaction(function () use ($card, $amountCents, $actor, $saleId, $note) {
            $balance = $card->balance_cents - $amountCents;
            $card->update([
                'balance_cents' => $balance,
                'status' => $balance > 0 ? 'active' : 'redeemed',
            ]);

            $this->recordTransaction($card, GiftCardTransactionType::Redeemed, -1 * $amountCents, $actor, $saleId, $note);

            return $card->fresh('transactions');
        });
    }

    public function adjust(GiftCard $card, int $amountCents, ?User $actor = null, ?string $note = null): GiftCard
    {
        $newBalance = $card->balance_cents + $amountCents;
        if ($newBalance < 0) {
            throw ValidationException::withMessages(['amount_cents' => ['Adjustment would make the balance negative.']]);
        }

        return DB::transaction(function () use ($card, $amountCents, $newBalance, $actor, $note) {
            $card->update([
                'balance_cents' => $newBalance,
                'status' => $newBalance > 0 ? 'active' : 'redeemed',
            ]);

            $this->recordTransaction($card, GiftCardTransactionType::Adjusted, $amountCents, $actor, null, $note);

            return $card->fresh('transactions');
        });
    }

    public function liabilitySummary(int $tenantId): array
    {
        $query = GiftCard::query()->where('tenant_id', $tenantId);

        return [
            'total_cards' => (clone $query)->count(),
            'active_cards' => (clone $query)->where('status', 'active')->count(),
            'outstanding_balance_cents' => (int) (clone $query)->sum('balance_cents'),
            'expired_balance_cents' => (int) (clone $query)->where('status', 'expired')->sum('balance_cents'),
        ];
    }

    public function formatCard(GiftCard $card): array
    {
        $card->loadMissing(['transactions' => fn ($q) => $q->latest()]);

        return [
            'uuid' => $card->uuid,
            'code' => $card->code,
            'status' => $card->status,
            'initial_balance_cents' => (int) $card->initial_balance_cents,
            'balance_cents' => (int) $card->balance_cents,
            'recipient_name' => $card->recipient_name,
            'recipient_email' => $card->recipient_email,
            'expires_at' => $card->expires_at?->toIso8601String(),
            'transactions' => $card->transactions->map(fn (GiftCardTransaction $transaction) => [
                'uuid' => $transaction->uuid,
                'type' => $transaction->type?->value ?? $transaction->type,
                'amount_cents' => (int) $transaction->amount_cents,
                'balance_after_cents' => (int) $transaction->balance_after_cents,
                'note' => $transaction->note,
                'created_at' => $transaction->created_at?->toIso8601String(),
            ])->values()->all(),
        ];
    }

    private function recordTransaction(
        GiftCard $card,
        GiftCardTransactionType $type,
        int $amountCents,
        ?User $actor = null,
        ?int $saleId = null,
        ?string $note = null,
    ): GiftCardTransaction {
        return GiftCardTransaction::query()->create([
            'tenant_id' => $card->tenant_id,
            'gift_card_id' => $card->id,
            'type' => $type,
            'amount_cents' => $amountCents,
            'balance_after_cents' => $card->fresh()->balance_cents,
            'sale_id' => $saleId,
            'user_id' => $actor?->id,
            'note' => $note,
        ]);
    }
}
