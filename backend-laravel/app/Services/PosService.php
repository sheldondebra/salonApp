<?php

namespace App\Services;

use App\Enums\CouponScope;
use App\Enums\PaymentPurpose;
use App\Enums\SaleItemType;
use App\Enums\SaleStatus;
use App\Enums\StockMovementType;
use App\Models\Appointment;
use App\Models\PaymentTransaction;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Service;
use App\Models\Tenant;
use App\Models\User;
use App\Support\TenantContext;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class PosService
{
    public function __construct(
        protected CouponService $coupons,
        protected InventoryService $inventory,
    ) {}

    /**
     * @param  list<array{type: string, service_id?: int, product_id?: int, quantity: int}>  $items
     * @return array{subtotal_cents: int, discount_cents: int, tax_cents: int, service_charge_cents: int, tip_cents: int, total_cents: int}
     */
    public function previewTotals(
        int $tenantId,
        int $locationId,
        array $items,
        int $taxCents = 0,
        int $serviceChargeCents = 0,
        int $tipCents = 0,
        ?string $couponCode = null,
    ): array {
        $lines = $this->resolveLineItems($tenantId, $items);
        $subtotal = collect($lines)->sum('line_total_cents');

        $discount = 0;
        if ($couponCode) {
            $serviceIds = collect($lines)
                ->where('item_type', SaleItemType::Service)
                ->pluck('service_id')
                ->filter()
                ->all();

            $result = $this->coupons->validate($couponCode, [
                'scope' => CouponScope::Booking,
                'tenant_id' => $tenantId,
                'service_ids' => array_values($serviceIds),
                'amount_cents' => $subtotal,
            ]);

            if (! $result['valid']) {
                throw new InvalidArgumentException($result['message'] ?? 'Invalid coupon.');
            }

            $discount = $result['discount_cents'];
        }

        $total = max(0, $subtotal - $discount + $taxCents + $serviceChargeCents + $tipCents);

        return [
            'subtotal_cents' => $subtotal,
            'discount_cents' => $discount,
            'tax_cents' => $taxCents,
            'service_charge_cents' => $serviceChargeCents,
            'tip_cents' => $tipCents,
            'total_cents' => $total,
        ];
    }

    /**
     * @param  array{
     *   location_id: int,
     *   client_user_id?: int|null,
     *   appointment_uuid?: string|null,
     *   items: list<array{type: string, service_id?: int, product_id?: int, quantity: int}>,
     *   coupon_code?: string|null,
     *   tax_cents?: int,
     *   service_charge_cents?: int,
     *   tip_cents?: int,
     *   payment_method: string,
     *   notes?: string|null,
     *   currency?: string,
     * }  $payload
     */
    public function completeSale(array $payload, User $cashier): Sale
    {
        $tenantId = TenantContext::id() ?? throw new InvalidArgumentException('Tenant context required.');

        return DB::transaction(function () use ($payload, $cashier, $tenantId) {
            $lines = $this->resolveLineItems($tenantId, $payload['items']);

            if ($lines === []) {
                throw new InvalidArgumentException('Add at least one item to the sale.');
            }

            $this->assertStockAvailable($tenantId, (int) $payload['location_id'], $lines);

            $subtotal = collect($lines)->sum('line_total_cents');
            $taxCents = max(0, (int) ($payload['tax_cents'] ?? 0));
            $serviceChargeCents = max(0, (int) ($payload['service_charge_cents'] ?? 0));
            $tipCents = max(0, (int) ($payload['tip_cents'] ?? 0));

            $coupon = null;
            $discountCents = 0;
            $couponCode = isset($payload['coupon_code']) ? trim((string) $payload['coupon_code']) : '';

            if ($couponCode !== '') {
                $serviceIds = collect($lines)
                    ->where('item_type', SaleItemType::Service)
                    ->pluck('service_id')
                    ->filter()
                    ->all();

                $result = $this->coupons->validate($couponCode, [
                    'scope' => CouponScope::Booking,
                    'tenant_id' => $tenantId,
                    'service_ids' => array_values($serviceIds),
                    'amount_cents' => $subtotal,
                ]);

                if (! $result['valid']) {
                    throw new InvalidArgumentException($result['message'] ?? 'Invalid coupon.');
                }

                $discountCents = $result['discount_cents'];
                $coupon = $result['coupon'];
            }

            $totalCents = max(0, $subtotal - $discountCents + $taxCents + $serviceChargeCents + $tipCents);

            $appointmentId = null;
            if (! empty($payload['appointment_uuid'])) {
                $appointment = Appointment::query()
                    ->where('uuid', $payload['appointment_uuid'])
                    ->firstOrFail();
                $appointmentId = $appointment->id;
            }

            $tenant = Tenant::query()->findOrFail($tenantId);
            $currency = $payload['currency'] ?? $tenant->currency ?? 'GHS';

            $sale = Sale::query()->create([
                'tenant_id' => $tenantId,
                'location_id' => $payload['location_id'],
                'client_user_id' => $payload['client_user_id'] ?? null,
                'appointment_id' => $appointmentId,
                'coupon_id' => $coupon?->id,
                'created_by_user_id' => $cashier->id,
                'status' => SaleStatus::Completed,
                'subtotal_cents' => $subtotal,
                'discount_cents' => $discountCents,
                'tax_cents' => $taxCents,
                'service_charge_cents' => $serviceChargeCents,
                'tip_cents' => $tipCents,
                'total_cents' => $totalCents,
                'currency' => $currency,
                'payment_method' => $payload['payment_method'],
                'coupon_code' => $coupon ? strtoupper($couponCode) : null,
                'notes' => $payload['notes'] ?? null,
                'metadata' => [
                    'split_payments' => [],
                    'tips_recorded' => $tipCents > 0,
                ],
                'completed_at' => now(),
            ]);

            $sale->update(['sale_number' => 'POS-'.str_pad((string) $sale->id, 6, '0', STR_PAD_LEFT)]);

            foreach ($lines as $line) {
                SaleItem::query()->create([
                    'sale_id' => $sale->id,
                    'tenant_id' => $tenantId,
                    'item_type' => $line['item_type'],
                    'service_id' => $line['service_id'] ?? null,
                    'product_id' => $line['product_id'] ?? null,
                    'name' => $line['name'],
                    'quantity' => $line['quantity'],
                    'unit_price_cents' => $line['unit_price_cents'],
                    'line_total_cents' => $line['line_total_cents'],
                ]);

                if ($line['item_type'] === SaleItemType::Product && $line['product_id']) {
                    $product = Product::query()->findOrFail($line['product_id']);
                    $this->inventory->adjustStock(
                        $product,
                        $payload['location_id'],
                        -1 * (int) $line['quantity'],
                        StockMovementType::Sale,
                        'POS sale',
                        $sale->sale_number,
                        $cashier,
                        saleId: $sale->id,
                    );
                }
            }

            PaymentTransaction::query()->create([
                'tenant_id' => $tenantId,
                'sale_id' => $sale->id,
                'appointment_id' => $appointmentId,
                'user_id' => $payload['client_user_id'] ?? null,
                'coupon_id' => $coupon?->id,
                'provider' => 'manual',
                'purpose' => PaymentPurpose::Pos,
                'provider_reference' => $sale->sale_number,
                'subtotal_cents' => $subtotal,
                'discount_cents' => $discountCents,
                'amount_cents' => $totalCents,
                'currency' => $currency,
                'status' => 'paid',
                'paid_at' => now(),
                'metadata' => [
                    'payment_method' => $payload['payment_method'],
                    'tax_cents' => $taxCents,
                    'service_charge_cents' => $serviceChargeCents,
                    'tip_cents' => $tipCents,
                ],
            ]);

            $this->coupons->recordRedemption($coupon);

            return $sale->fresh(['items', 'client', 'location', 'appointment', 'payment']);
        });
    }

    /**
     * @param  list<array{type: string, service_id?: int, product_id?: int, quantity: int}>  $items
     * @return list<array{
     *   item_type: SaleItemType,
     *   service_id: ?int,
     *   product_id: ?int,
     *   name: string,
     *   quantity: int,
     *   unit_price_cents: int,
     *   line_total_cents: int,
     * }>
     */
    protected function resolveLineItems(int $tenantId, array $items): array
    {
        $lines = [];

        foreach ($items as $item) {
            $type = SaleItemType::from($item['type']);
            $qty = max(1, (int) ($item['quantity'] ?? 1));

            if ($type === SaleItemType::Service) {
                $service = Service::query()
                    ->where('tenant_id', $tenantId)
                    ->whereBool('is_active')
                    ->findOrFail($item['service_id'] ?? 0);

                $unit = (int) $service->price_cents;
                $lines[] = [
                    'item_type' => SaleItemType::Service,
                    'service_id' => $service->id,
                    'product_id' => null,
                    'name' => $service->name,
                    'quantity' => $qty,
                    'unit_price_cents' => $unit,
                    'line_total_cents' => $unit * $qty,
                ];
            } else {
                $product = Product::query()
                    ->where('tenant_id', $tenantId)
                    ->whereBool('is_active')
                    ->findOrFail($item['product_id'] ?? 0);

                $unit = (int) $product->retail_cents;
                $lines[] = [
                    'item_type' => SaleItemType::Product,
                    'service_id' => null,
                    'product_id' => $product->id,
                    'name' => $product->name,
                    'quantity' => $qty,
                    'unit_price_cents' => $unit,
                    'line_total_cents' => $unit * $qty,
                ];
            }
        }

        return $lines;
    }

    /**
     * @param  list<array{item_type: SaleItemType, product_id: ?int, name: string, quantity: int}>  $lines
     */
    protected function assertStockAvailable(int $tenantId, int $locationId, array $lines): void
    {
        $tenant = Tenant::query()->findOrFail($tenantId);

        if ($this->inventory->allowNegativeStock($tenant)) {
            return;
        }

        foreach ($lines as $line) {
            if ($line['item_type'] !== SaleItemType::Product || empty($line['product_id'])) {
                continue;
            }

            $product = Product::query()->findOrFail($line['product_id']);
            $available = $this->inventory->productQuantity($product, $locationId);

            if ($available < (int) $line['quantity']) {
                throw new InvalidArgumentException(
                    "Insufficient stock for \"{$line['name']}\" at this branch. Available: {$available}."
                );
            }
        }
    }
}
