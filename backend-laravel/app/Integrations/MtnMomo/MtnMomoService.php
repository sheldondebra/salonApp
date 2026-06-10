<?php

namespace App\Integrations\MtnMomo;

use App\Enums\PaymentRequestStatus;
use App\Models\PaymentRequest;
use App\Models\Tenant;
use App\Services\TenantInvoiceService;
use App\Support\TenantContext;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class MtnMomoService
{
    public function __construct(
        protected MtnMomoConfigResolver $configResolver,
        protected MtnMomoCollectionService $collection,
        protected TenantInvoiceService $invoices,
    ) {}

    public function dispatch(PaymentRequest $paymentRequest): PaymentRequest
    {
        if ($paymentRequest->gateway !== 'mtn_momo') {
            return $paymentRequest;
        }

        if ($paymentRequest->transaction_uuid && $paymentRequest->status === PaymentRequestStatus::Processing) {
            return $paymentRequest;
        }

        $tenant = $this->tenantFor($paymentRequest);
        $config = $this->configResolver->forTenant($tenant);

        if (! $this->configResolver->isConfigured($config)) {
            return $this->markFailed($paymentRequest, 'MTN MoMo is not configured for this salon.');
        }

        $transactionUuid = (string) Str::uuid();
        $partyId = MtnMomoCollectionService::formatPartyId($paymentRequest->phone);
        $amount = MtnMomoCollectionService::formatAmount($paymentRequest->amount_cents);

        try {
            $result = $this->collection->requestToPay(
                $config,
                $transactionUuid,
                $partyId,
                $amount,
                $paymentRequest->currency,
                $paymentRequest->reference,
                'Schedelux payment request',
                $paymentRequest->description ?? 'Payment request '.$paymentRequest->reference,
            );
        } catch (\Throwable $e) {
            return $this->markFailed($paymentRequest, 'MTN request failed: '.$e->getMessage(), [
                'dispatch_error' => $e->getMessage(),
            ]);
        }

        if (! $result['ok']) {
            return $this->markFailed($paymentRequest, 'MTN rejected the payment request.', [
                'status_code' => $result['status_code'],
                'body' => $result['body'],
            ]);
        }

        $paymentRequest->update([
            'transaction_uuid' => $transactionUuid,
            'status' => PaymentRequestStatus::Processing,
            'provider_status' => 'PENDING',
            'provider_response' => [
                'dispatch' => $result['body'],
                'transaction_uuid' => $transactionUuid,
            ],
            'failed_reason' => null,
        ]);

        return $paymentRequest->fresh();
    }

    public function verify(PaymentRequest $paymentRequest): PaymentRequest
    {
        if ($paymentRequest->gateway !== 'mtn_momo') {
            throw ValidationException::withMessages([
                'gateway' => ['Status verification is only available for MTN MoMo Direct requests.'],
            ]);
        }

        if (! $paymentRequest->transaction_uuid) {
            throw ValidationException::withMessages([
                'transaction_uuid' => ['This payment request has not been sent to MTN yet.'],
            ]);
        }

        if (in_array($paymentRequest->status, [PaymentRequestStatus::Success, PaymentRequestStatus::Cancelled], true)) {
            return $paymentRequest;
        }

        $tenant = $this->tenantFor($paymentRequest);
        $config = $this->configResolver->forTenant($tenant);

        try {
            $result = $this->collection->getTransactionStatus($config, $paymentRequest->transaction_uuid);
        } catch (\Throwable $e) {
            $paymentRequest->update([
                'status_checked_at' => now(),
                'provider_response' => array_merge($paymentRequest->provider_response ?? [], [
                    'last_verify_error' => $e->getMessage(),
                ]),
            ]);

            throw ValidationException::withMessages([
                'mtn' => ['Could not verify MTN status: '.$e->getMessage()],
            ]);
        }

        return $this->applyProviderStatus($paymentRequest, $result);
    }

    /** @param  array<string, mixed>  $payload */
    public function handleCallback(string $transactionUuid, array $payload = []): ?PaymentRequest
    {
        $paymentRequest = PaymentRequest::query()
            ->where('transaction_uuid', $transactionUuid)
            ->where('gateway', 'mtn_momo')
            ->first();

        if (! $paymentRequest) {
            return null;
        }

        $paymentRequest->update([
            'callback_received_at' => now(),
            'provider_response' => array_merge($paymentRequest->provider_response ?? [], [
                'callback' => $payload,
            ]),
        ]);

        try {
            return $this->verify($paymentRequest);
        } catch (\Throwable) {
            return $paymentRequest->fresh();
        }
    }

    public function cancel(PaymentRequest $paymentRequest): PaymentRequest
    {
        if (! in_array($paymentRequest->status, [PaymentRequestStatus::Pending, PaymentRequestStatus::Processing], true)) {
            throw ValidationException::withMessages([
                'status' => ['Only pending or processing payment requests can be cancelled.'],
            ]);
        }

        $paymentRequest->update([
            'status' => PaymentRequestStatus::Cancelled,
            'cancelled_at' => now(),
        ]);

        return $paymentRequest->fresh();
    }

    public function retry(PaymentRequest $paymentRequest): PaymentRequest
    {
        if (! in_array($paymentRequest->status, [PaymentRequestStatus::Failed, PaymentRequestStatus::Expired], true)) {
            throw ValidationException::withMessages([
                'status' => ['Only failed or expired payment requests can be retried.'],
            ]);
        }

        $paymentRequest->update([
            'status' => PaymentRequestStatus::Pending,
            'transaction_uuid' => null,
            'provider_status' => null,
            'external_reference' => null,
            'failed_reason' => null,
            'provider_response' => null,
            'callback_received_at' => null,
            'status_checked_at' => null,
        ]);

        return $this->dispatch($paymentRequest->fresh());
    }

    /** @param  array{status: string, financialTransactionId: ?string, reason: ?string, raw: mixed}  $result */
    protected function applyProviderStatus(PaymentRequest $paymentRequest, array $result): PaymentRequest
    {
        return DB::transaction(function () use ($paymentRequest, $result) {
            $locked = PaymentRequest::query()->lockForUpdate()->find($paymentRequest->id);

            if (! $locked || $locked->status === PaymentRequestStatus::Success) {
                return $paymentRequest->fresh();
            }

            $status = strtoupper($result['status']);
            $updates = [
                'provider_status' => $status,
                'status_checked_at' => now(),
                'provider_response' => array_merge($locked->provider_response ?? [], [
                    'last_status' => $result['raw'],
                ]),
            ];

            if ($status === 'SUCCESSFUL') {
                $updates['status'] = PaymentRequestStatus::Success;
                $updates['paid_at'] = now();
                $updates['external_reference'] = $result['financialTransactionId'];
                $updates['failed_reason'] = null;
            } elseif (in_array($status, ['FAILED', 'REJECTED', 'TIMEOUT', 'CANCELLED'], true)) {
                $updates['status'] = PaymentRequestStatus::Failed;
                $updates['failed_reason'] = $result['reason'] ?? ('MTN status: '.$status);
            } else {
                $updates['status'] = PaymentRequestStatus::Processing;
            }

            $locked->update($updates);

            $fresh = $locked->fresh();

            if ($status === 'SUCCESSFUL') {
                $this->invoices->applyPaymentRequest($fresh);
            }

            return $fresh;
        });
    }

    /** @param  array<string, mixed>  $response */
    protected function markFailed(PaymentRequest $paymentRequest, string $reason, array $response = []): PaymentRequest
    {
        $paymentRequest->update([
            'status' => PaymentRequestStatus::Failed,
            'failed_reason' => $reason,
            'provider_response' => array_merge($paymentRequest->provider_response ?? [], $response),
        ]);

        return $paymentRequest->fresh();
    }

    protected function tenantFor(PaymentRequest $paymentRequest): Tenant
    {
        $tenant = TenantContext::get() ?? $paymentRequest->tenant;

        if (! $tenant) {
            throw ValidationException::withMessages([
                'tenant' => ['Tenant context is required for MTN operations.'],
            ]);
        }

        return $tenant;
    }
}
