<?php

namespace App\Services;

use App\Enums\ClientMembershipStatus;
use App\Enums\GiftCardTransactionType;
use App\Enums\PackageBalanceStatus;
use App\Models\ClientMembership;
use App\Models\ClientPackageBalance;
use App\Models\GiftCard;
use App\Models\GiftCardTransaction;
use App\Models\PackageRedemption;
use App\Support\ReportFilters;
use Carbon\Carbon;

class FinancePrepaidBalanceService
{
    public function __construct(
        private readonly GiftCardService $giftCards,
        private readonly ServicePackageService $packages,
        private readonly MembershipService $memberships,
    ) {}

    /** @return array<string, mixed> */
    public function report(ReportFilters $filters): array
    {
        $tenantId = (int) $filters->tenantId;
        $from = $filters->from;
        $to = $filters->to;

        $giftLiability = $this->giftCards->liabilitySummary($tenantId);
        $packageLiability = $this->packageLiability($tenantId);

        $giftSalesCents = $this->giftCardSalesInRange($tenantId, $from, $to);
        $giftRedemptionsCents = $this->giftCardRedemptionsInRange($tenantId, $from, $to);
        $packageSalesCents = $this->packageSalesInRange($tenantId, $from, $to);
        $packageRedemptions = $this->packageRedemptionsInRange($tenantId, $from, $to);
        $membershipRevenueCents = $this->membershipRevenueInRange($tenantId, $from, $to);

        return [
            'filters' => $filters->toArray(),
            'summary' => [
                'gift_card_liability_cents' => (int) ($giftLiability['outstanding_balance_cents'] ?? 0),
                'gift_card_expired_cents' => (int) ($giftLiability['expired_balance_cents'] ?? 0),
                'gift_card_active_count' => (int) ($giftLiability['active_cards'] ?? 0),
                'package_liability_cents' => $packageLiability['active_liability_cents'],
                'package_expired_liability_cents' => $packageLiability['expired_liability_cents'],
                'package_active_count' => $packageLiability['active_count'],
                'membership_revenue_cents' => $membershipRevenueCents,
                'active_memberships_count' => $this->activeMembershipsCount($tenantId),
                'gift_card_sales_cents' => $giftSalesCents,
                'gift_card_redemptions_cents' => $giftRedemptionsCents,
                'package_sales_cents' => $packageSalesCents,
                'package_redemptions_count' => $packageRedemptions['count'],
                'package_sessions_redeemed' => $packageRedemptions['sessions'],
                'total_prepaid_liability_cents' => (int) ($giftLiability['outstanding_balance_cents'] ?? 0)
                    + $packageLiability['active_liability_cents'],
            ],
            'active_gift_cards' => $this->activeGiftCards($tenantId),
            'active_packages' => $this->activePackageBalances($tenantId),
            'membership_payments' => $this->membershipPaymentsInRange($tenantId, $from, $to),
            'recent_redemptions' => $this->recentRedemptions($tenantId, $from, $to),
        ];
    }

    /** @return array<string, mixed> */
    public function lookup(int $tenantId, string $type, ?string $code = null, ?string $balanceUuid = null): array
    {
        if ($type === 'gift_card') {
            abort_unless($code, 422, 'Gift card code is required.');
            $card = $this->giftCards->lookupByCode($tenantId, $code);

            return [
                'type' => 'gift_card',
                'gift_card' => $this->giftCards->formatCard($card),
            ];
        }

        if ($type === 'package') {
            abort_unless($balanceUuid, 422, 'Package balance UUID is required.');
            $balance = ClientPackageBalance::query()
                ->where('tenant_id', $tenantId)
                ->where('uuid', $balanceUuid)
                ->with(['package.service:id,uuid,name', 'client:id,name,email', 'redemptions' => fn ($q) => $q->latest()->limit(10)])
                ->firstOrFail();

            return [
                'type' => 'package',
                'package_balance' => array_merge(
                    $this->packages->formatBalance($balance),
                    ['liability_cents' => $this->balanceLiabilityCents($balance)]
                ),
                'recent_redemptions' => $balance->redemptions
                    ->map(fn (PackageRedemption $r) => $this->packages->formatRedemption($r))
                    ->values()
                    ->all(),
            ];
        }

        abort(422, 'Unsupported lookup type.');
    }

    /** @return list<array<string, mixed>> */
    public function exportRows(ReportFilters $filters): array
    {
        $payload = $this->report($filters);
        $summary = $payload['summary'];
        $rows = [
            ['section' => 'summary', 'label' => 'Gift card liability', 'amount_cents' => $summary['gift_card_liability_cents'], 'count' => $summary['gift_card_active_count']],
            ['section' => 'summary', 'label' => 'Package liability', 'amount_cents' => $summary['package_liability_cents'], 'count' => $summary['package_active_count']],
            ['section' => 'summary', 'label' => 'Membership revenue', 'amount_cents' => $summary['membership_revenue_cents'], 'count' => $summary['active_memberships_count']],
            ['section' => 'summary', 'label' => 'Gift card sales', 'amount_cents' => $summary['gift_card_sales_cents'], 'count' => null],
            ['section' => 'summary', 'label' => 'Gift card redemptions', 'amount_cents' => $summary['gift_card_redemptions_cents'], 'count' => null],
            ['section' => 'summary', 'label' => 'Package sales', 'amount_cents' => $summary['package_sales_cents'], 'count' => null],
            ['section' => 'summary', 'label' => 'Total prepaid liability', 'amount_cents' => $summary['total_prepaid_liability_cents'], 'count' => null],
        ];

        foreach ($payload['active_gift_cards'] as $card) {
            $rows[] = [
                'section' => 'gift_card',
                'label' => $card['code'],
                'amount_cents' => $card['balance_cents'],
                'count' => null,
            ];
        }

        foreach ($payload['active_packages'] as $balance) {
            $rows[] = [
                'section' => 'package',
                'label' => $balance['package_name'] ?? $balance['uuid'],
                'amount_cents' => $balance['liability_cents'],
                'count' => $balance['sessions_remaining'],
            ];
        }

        return $rows;
    }

    /** @return array{active_liability_cents: int, expired_liability_cents: int, active_count: int} */
    protected function packageLiability(int $tenantId): array
    {
        $balances = ClientPackageBalance::query()
            ->where('tenant_id', $tenantId)
            ->with('package:id,price_cents')
            ->get();

        $activeLiability = 0;
        $expiredLiability = 0;
        $activeCount = 0;

        foreach ($balances as $balance) {
            $liability = $this->balanceLiabilityCents($balance);
            if ($balance->status === PackageBalanceStatus::Active && $balance->sessions_remaining > 0) {
                $activeLiability += $liability;
                $activeCount++;
            } elseif ($balance->status === PackageBalanceStatus::Expired && $balance->sessions_remaining > 0) {
                $expiredLiability += $liability;
            }
        }

        return [
            'active_liability_cents' => $activeLiability,
            'expired_liability_cents' => $expiredLiability,
            'active_count' => $activeCount,
        ];
    }

    protected function balanceLiabilityCents(ClientPackageBalance $balance): int
    {
        if ($balance->sessions_remaining <= 0 || $balance->sessions_total <= 0) {
            return 0;
        }

        $price = (int) ($balance->package?->price_cents ?? 0);
        if ($price <= 0) {
            return 0;
        }

        return (int) round(($balance->sessions_remaining / $balance->sessions_total) * $price);
    }

    protected function giftCardSalesInRange(int $tenantId, Carbon $from, Carbon $to): int
    {
        return (int) GiftCardTransaction::query()
            ->where('tenant_id', $tenantId)
            ->where('type', GiftCardTransactionType::Issued)
            ->whereBetween('created_at', [$from, $to])
            ->where('amount_cents', '>', 0)
            ->sum('amount_cents');
    }

    protected function giftCardRedemptionsInRange(int $tenantId, Carbon $from, Carbon $to): int
    {
        return (int) abs(GiftCardTransaction::query()
            ->where('tenant_id', $tenantId)
            ->where('type', GiftCardTransactionType::Redeemed)
            ->whereBetween('created_at', [$from, $to])
            ->sum('amount_cents'));
    }

    protected function packageSalesInRange(int $tenantId, Carbon $from, Carbon $to): int
    {
        return (int) ClientPackageBalance::query()
            ->where('tenant_id', $tenantId)
            ->whereBetween('created_at', [$from, $to])
            ->with(['package:id,price_cents', 'sale:id,total_cents'])
            ->get()
            ->sum(fn (ClientPackageBalance $balance) => (int) (
                $balance->sale?->total_cents ?? $balance->package?->price_cents ?? 0
            ));
    }

    /** @return array{count: int, sessions: int} */
    protected function packageRedemptionsInRange(int $tenantId, Carbon $from, Carbon $to): array
    {
        $query = PackageRedemption::query()
            ->where('tenant_id', $tenantId)
            ->whereBetween('created_at', [$from, $to]);

        return [
            'count' => (int) (clone $query)->count(),
            'sessions' => (int) (clone $query)->sum('sessions_used'),
        ];
    }

    protected function membershipRevenueInRange(int $tenantId, Carbon $from, Carbon $to): int
    {
        return (int) ClientMembership::query()
            ->where('tenant_id', $tenantId)
            ->whereBetween('created_at', [$from, $to])
            ->with(['plan:id,price_cents', 'sale:id,total_cents'])
            ->get()
            ->sum(fn (ClientMembership $membership) => (int) (
                $membership->sale?->total_cents ?? $membership->plan?->price_cents ?? 0
            ));
    }

    protected function activeMembershipsCount(int $tenantId): int
    {
        return ClientMembership::query()
            ->where('tenant_id', $tenantId)
            ->where('status', ClientMembershipStatus::Active)
            ->count();
    }

    /** @return list<array<string, mixed>> */
    protected function activeGiftCards(int $tenantId, int $limit = 25): array
    {
        return GiftCard::query()
            ->where('tenant_id', $tenantId)
            ->where('status', 'active')
            ->where('balance_cents', '>', 0)
            ->latest()
            ->limit($limit)
            ->get(['uuid', 'code', 'balance_cents', 'initial_balance_cents', 'recipient_name', 'expires_at', 'status'])
            ->map(fn (GiftCard $card) => [
                'uuid' => $card->uuid,
                'code' => $card->code,
                'status' => $card->status,
                'balance_cents' => (int) $card->balance_cents,
                'initial_balance_cents' => (int) $card->initial_balance_cents,
                'recipient_name' => $card->recipient_name,
                'expires_at' => $card->expires_at?->toIso8601String(),
            ])
            ->values()
            ->all();
    }

    /** @return list<array<string, mixed>> */
    protected function activePackageBalances(int $tenantId, int $limit = 25): array
    {
        return ClientPackageBalance::query()
            ->where('tenant_id', $tenantId)
            ->where('status', PackageBalanceStatus::Active)
            ->where('sessions_remaining', '>', 0)
            ->with(['package:id,uuid,name,price_cents', 'client:id,name,email'])
            ->latest()
            ->limit($limit)
            ->get()
            ->map(function (ClientPackageBalance $balance) {
                return [
                    'uuid' => $balance->uuid,
                    'status' => $balance->status?->value ?? $balance->status,
                    'sessions_total' => (int) $balance->sessions_total,
                    'sessions_remaining' => (int) $balance->sessions_remaining,
                    'liability_cents' => $this->balanceLiabilityCents($balance),
                    'package_name' => $balance->package?->name,
                    'client_name' => $balance->client?->name,
                    'expires_at' => $balance->expires_at?->toIso8601String(),
                ];
            })
            ->values()
            ->all();
    }

    /** @return list<array<string, mixed>> */
    protected function membershipPaymentsInRange(int $tenantId, Carbon $from, Carbon $to, int $limit = 25): array
    {
        return ClientMembership::query()
            ->where('tenant_id', $tenantId)
            ->whereBetween('created_at', [$from, $to])
            ->with(['plan:id,name,price_cents', 'client:id,name,email', 'sale:id,total_cents'])
            ->latest()
            ->limit($limit)
            ->get()
            ->map(fn (ClientMembership $membership) => [
                'uuid' => $membership->uuid,
                'status' => $membership->status?->value ?? $membership->status,
                'plan_name' => $membership->plan?->name,
                'client_name' => $membership->client?->name,
                'amount_cents' => (int) ($membership->sale?->total_cents ?? $membership->plan?->price_cents ?? 0),
                'starts_at' => $membership->starts_at?->toIso8601String(),
                'ends_at' => $membership->ends_at?->toIso8601String(),
                'created_at' => $membership->created_at?->toIso8601String(),
            ])
            ->values()
            ->all();
    }

    /** @return list<array<string, mixed>> */
    protected function recentRedemptions(int $tenantId, Carbon $from, Carbon $to, int $limit = 30): array
    {
        $giftRows = GiftCardTransaction::query()
            ->where('tenant_id', $tenantId)
            ->where('type', GiftCardTransactionType::Redeemed)
            ->whereBetween('created_at', [$from, $to])
            ->with(['giftCard:id,code,uuid'])
            ->latest()
            ->limit($limit)
            ->get()
            ->map(fn (GiftCardTransaction $tx) => [
                'type' => 'gift_card',
                'reference' => $tx->giftCard?->code,
                'label' => $tx->giftCard?->code ?? 'Gift card',
                'amount_cents' => abs((int) $tx->amount_cents),
                'occurred_at' => $tx->created_at?->toIso8601String(),
            ]);

        $packageRows = PackageRedemption::query()
            ->where('tenant_id', $tenantId)
            ->whereBetween('created_at', [$from, $to])
            ->with(['balance.package:id,name'])
            ->latest()
            ->limit($limit)
            ->get()
            ->map(fn (PackageRedemption $r) => [
                'type' => 'package',
                'reference' => $r->balance?->uuid,
                'label' => $r->balance?->package?->name ?? 'Package',
                'amount_cents' => null,
                'sessions_used' => (int) $r->sessions_used,
                'occurred_at' => $r->created_at?->toIso8601String(),
            ]);

        return $giftRows
            ->concat($packageRows)
            ->sortByDesc('occurred_at')
            ->take($limit)
            ->values()
            ->all();
    }
}
