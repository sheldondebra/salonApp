<?php

namespace App\Services;

use App\Enums\TaxAppliesTo;
use App\Enums\TaxMode;
use App\Models\TenantTaxRate;

class TenantTaxRateService
{
    /** @var list<array{name: string, rate: float, applies_to: string, inclusive_or_exclusive: string, is_default?: bool}> */
    private const DEFAULT_RATES = [
        [
            'name' => 'Standard VAT',
            'rate' => 15.0,
            'applies_to' => 'all',
            'inclusive_or_exclusive' => 'exclusive',
            'is_default' => true,
        ],
    ];

    /** @return list<TenantTaxRate> */
    public function list(int $tenantId, bool $activeOnly = false): array
    {
        $this->ensureDefaults($tenantId);

        $query = TenantTaxRate::query()
            ->where('tenant_id', $tenantId)
            ->orderBy('sort_order')
            ->orderBy('name');

        if ($activeOnly) {
            $query->whereBool('is_active', true);
        }

        return $query->get()->all();
    }

    public function defaultRate(int $tenantId): ?TenantTaxRate
    {
        $this->ensureDefaults($tenantId);

        return TenantTaxRate::query()
            ->where('tenant_id', $tenantId)
            ->whereBool('is_active', true)
            ->whereBool('is_default', true)
            ->orderBy('sort_order')
            ->first()
            ?? TenantTaxRate::query()
                ->where('tenant_id', $tenantId)
                ->whereBool('is_active', true)
                ->orderBy('sort_order')
                ->first();
    }

    /** @param  array<string, mixed>  $data */
    public function create(int $tenantId, array $data): TenantTaxRate
    {
        if (! empty($data['is_default'])) {
            $this->clearDefault($tenantId);
        }

        return TenantTaxRate::query()->create([
            'tenant_id' => $tenantId,
            'name' => $data['name'],
            'rate' => max(0, min(100, (float) $data['rate'])),
            'applies_to' => $data['applies_to'] ?? TaxAppliesTo::All->value,
            'inclusive_or_exclusive' => $data['inclusive_or_exclusive'] ?? TaxMode::Exclusive->value,
            'is_active' => $data['is_active'] ?? true,
            'is_default' => (bool) ($data['is_default'] ?? false),
            'sort_order' => (int) ($data['sort_order'] ?? 0),
        ]);
    }

    /** @param  array<string, mixed>  $data */
    public function update(TenantTaxRate $rate, int $tenantId, array $data): TenantTaxRate
    {
        abort_unless($rate->tenant_id === $tenantId, 404);

        if (! empty($data['is_default'])) {
            $this->clearDefault($rate->tenant_id, $rate->id);
        }

        foreach ([
            'name',
            'applies_to',
            'inclusive_or_exclusive',
            'is_active',
            'is_default',
            'sort_order',
        ] as $field) {
            if (array_key_exists($field, $data)) {
                $rate->{$field} = $data[$field];
            }
        }

        if (array_key_exists('rate', $data)) {
            $rate->rate = max(0, min(100, (float) $data['rate']));
        }

        $rate->save();

        return $rate->fresh();
    }

    /**
     * @param  list<array{type: string, amount_cents: int}>  $lines
     * @return array{tax_cents: int, rate: float, mode: string, applies_to: string}
     */
    public function calculateForLines(int $tenantId, array $lines): array
    {
        $rate = $this->defaultRate($tenantId);
        if (! $rate) {
            return [
                'tax_cents' => 0,
                'rate' => 0.0,
                'mode' => TaxMode::Exclusive->value,
                'applies_to' => TaxAppliesTo::All->value,
            ];
        }

        $taxable = $this->taxableSubtotal($lines, $rate);
        $taxCents = $this->taxAmountCents($taxable, (float) $rate->rate, $rate->inclusive_or_exclusive);

        return [
            'tax_cents' => $taxCents,
            'rate' => (float) $rate->rate,
            'mode' => $rate->inclusive_or_exclusive?->value ?? $rate->inclusive_or_exclusive,
            'applies_to' => $rate->applies_to?->value ?? $rate->applies_to,
            'tax_rate_id' => $rate->id,
            'tax_rate_name' => $rate->name,
        ];
    }

    /** @return array<string, mixed> */
    public function formatRate(TenantTaxRate $rate): array
    {
        return [
            'id' => $rate->id,
            'name' => $rate->name,
            'rate' => (float) $rate->rate,
            'applies_to' => $rate->applies_to?->value ?? $rate->applies_to,
            'inclusive_or_exclusive' => $rate->inclusive_or_exclusive?->value ?? $rate->inclusive_or_exclusive,
            'is_active' => (bool) $rate->is_active,
            'is_default' => (bool) $rate->is_default,
            'sort_order' => (int) $rate->sort_order,
            'updated_at' => $rate->updated_at?->toIso8601String(),
        ];
    }

    protected function ensureDefaults(int $tenantId): void
    {
        if (TenantTaxRate::query()->where('tenant_id', $tenantId)->exists()) {
            return;
        }

        foreach (self::DEFAULT_RATES as $index => $row) {
            TenantTaxRate::query()->create([
                'tenant_id' => $tenantId,
                'name' => $row['name'],
                'rate' => $row['rate'],
                'applies_to' => $row['applies_to'],
                'inclusive_or_exclusive' => $row['inclusive_or_exclusive'],
                'is_default' => $row['is_default'] ?? false,
                'sort_order' => $index,
                'is_active' => true,
            ]);
        }
    }

    protected function clearDefault(int $tenantId, ?int $exceptId = null): void
    {
        TenantTaxRate::query()
            ->where('tenant_id', $tenantId)
            ->when($exceptId, fn ($q) => $q->where('id', '!=', $exceptId))
            ->update(['is_default' => false]);
    }

    /**
     * @param  list<array{type: string, amount_cents: int}>  $lines
     */
    protected function taxableSubtotal(array $lines, TenantTaxRate $rate): int
    {
        $appliesTo = $rate->applies_to?->value ?? $rate->applies_to;

        return (int) collect($lines)->sum(function (array $line) use ($appliesTo) {
            $type = $line['type'] ?? 'service';
            $amount = max(0, (int) ($line['amount_cents'] ?? 0));

            return match ($appliesTo) {
                TaxAppliesTo::Services->value => $type === 'service' || $type === 'addon' ? $amount : 0,
                TaxAppliesTo::Products->value => $type === 'product' ? $amount : 0,
                default => $amount,
            };
        });
    }

    protected function taxAmountCents(int $taxableCents, float $ratePercent, TaxMode|string $mode): int
    {
        if ($taxableCents <= 0 || $ratePercent <= 0) {
            return 0;
        }

        $modeValue = $mode instanceof TaxMode ? $mode->value : $mode;

        if ($modeValue === TaxMode::Inclusive->value) {
            return (int) round($taxableCents - ($taxableCents / (1 + ($ratePercent / 100))));
        }

        return (int) round($taxableCents * ($ratePercent / 100));
    }
}
