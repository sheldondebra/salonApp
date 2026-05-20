<?php

namespace App\Services;

use App\Enums\SmsWalletTransactionType;
use App\Integrations\Payments\PaymentGatewayManager;
use App\Models\SmsPackage;
use App\Models\SmsPurchaseInvoice;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use InvalidArgumentException;

class SmsPackagePurchaseService
{
    public function __construct(
        protected PaymentGatewayManager $gateways,
        protected SmsWalletService $wallet,
    ) {}

    /**
     * @return array{
     *   invoice: SmsPurchaseInvoice,
     *   authorization_url: ?string,
     *   reference: string,
     *   demo_mode: bool,
     * }
     */
    public function startPurchase(Tenant $tenant, SmsPackage $package, User $user, string $provider = 'paystack'): array
    {
        if (! $package->is_active) {
            throw new InvalidArgumentException('This SMS package is not available.');
        }

        $credits = $package->totalCredits();
        $reference = 'sms_'.Str::uuid();
        $currency = $package->currency ?: ($tenant->currency ?? 'GHS');

        $invoice = SmsPurchaseInvoice::query()->create([
            'tenant_id' => $tenant->id,
            'sms_package_id' => $package->id,
            'credits' => $credits,
            'amount_cents' => (int) $package->price_cents,
            'currency' => $currency,
            'status' => 'pending',
            'payment_gateway' => $provider,
            'provider_reference' => $reference,
            'meta' => [
                'package_name' => $package->name,
                'purchased_by' => $user->id,
            ],
        ]);

        $frontend = config('billing.frontend_url', 'http://localhost:3000');
        $callback = "{$frontend}/{$tenant->slug}/settings?sms_purchase=1";

        $gateway = $this->gateways->resolve($provider);
        $init = $gateway->initializePayment([
            'email' => $user->email,
            'name' => $user->name,
            'amount_cents' => (int) $package->price_cents,
            'currency' => $currency,
            'reference' => $reference,
            'callback_url' => $callback,
            'metadata' => [
                'purpose' => 'sms_package',
                'invoice_id' => $invoice->id,
                'tenant_id' => $tenant->id,
                'package_id' => $package->id,
            ],
        ]);

        if (! empty($init['demo_mode'])) {
            $this->fulfillInvoice($invoice->fresh(), $reference);

            return [
                'invoice' => $invoice->fresh(['package']),
                'authorization_url' => $init['authorization_url'],
                'reference' => $reference,
                'demo_mode' => true,
            ];
        }

        return [
            'invoice' => $invoice->load('package'),
            'authorization_url' => $init['authorization_url'] ?? null,
            'reference' => $reference,
            'demo_mode' => false,
        ];
    }

    public function verifyAndFulfill(string $reference): SmsPurchaseInvoice
    {
        $invoice = SmsPurchaseInvoice::query()
            ->withoutGlobalScope('tenant')
            ->where('provider_reference', $reference)
            ->firstOrFail();

        if ($invoice->status === 'paid') {
            return $invoice->load('package');
        }

        $gateway = $this->gateways->resolve($invoice->payment_gateway ?? 'paystack');
        $verify = $gateway->verifyPayment($reference);

        if (($verify['status'] ?? '') !== 'success') {
            $invoice->update(['status' => 'failed']);

            throw new InvalidArgumentException('Payment was not successful.');
        }

        return $this->fulfillInvoice($invoice, $reference);
    }

    public function fulfillInvoice(SmsPurchaseInvoice $invoice, ?string $reference = null): SmsPurchaseInvoice
    {
        if ($invoice->status === 'paid') {
            return $invoice->load('package');
        }

        return DB::transaction(function () use ($invoice, $reference) {
            $invoice->update([
                'status' => 'paid',
                'paid_at' => now(),
                'provider_reference' => $reference ?? $invoice->provider_reference,
            ]);

            $this->wallet->credit(
                $invoice->tenant_id,
                (int) $invoice->credits,
                SmsWalletTransactionType::Purchase,
                'SMS package purchase',
                null,
                SmsPurchaseInvoice::class,
                $invoice->id,
                ['package_id' => $invoice->sms_package_id],
            );

            return $invoice->fresh(['package']);
        });
    }
}
