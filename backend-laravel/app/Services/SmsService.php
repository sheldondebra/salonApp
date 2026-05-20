<?php

namespace App\Services;

use App\Enums\SmsNotificationType;
use App\Integrations\Sms\SmsGatewayContract;
use App\Jobs\SendSmsJob;
use App\Enums\SmsWalletTransactionType;
use App\Models\SmsDeliveryLog;
use App\Models\SmsMessage;
use App\Models\TenantSmsUsage;
use Illuminate\Support\Facades\Log;

class SmsService
{
    public function __construct(
        protected SmsGatewayContract $gateway,
        protected SmsWalletService $wallet,
    ) {}

    /**
     * Queue an SMS for async delivery (requires queue worker).
     *
     * @param  array<string, mixed>  $meta
     */
    public function queue(
        string $to,
        string $message,
        SmsNotificationType $type = SmsNotificationType::General,
        ?int $tenantId = null,
        array $meta = [],
    ): SmsMessage {
        if ($tenantId && ! $this->wallet->canSend($tenantId)) {
            $log = SmsMessage::query()->create([
                'tenant_id' => $tenantId,
                'provider' => $this->gateway->provider(),
                'type' => $type->value,
                'recipient' => $to,
                'status' => 'failed',
                'body' => $message,
                'meta' => array_merge($meta, ['error' => 'insufficient_sms_credits']),
                'response' => ['error' => 'Insufficient SMS credits in tenant wallet.'],
            ]);

            $this->recordDeliveryLog($log, 'failed', 0);

            return $log;
        }

        $log = SmsMessage::query()->create([
            'tenant_id' => $tenantId,
            'provider' => $this->gateway->provider(),
            'type' => $type->value,
            'recipient' => $to,
            'status' => 'queued',
            'body' => $message,
            'meta' => $meta,
        ]);

        SendSmsJob::dispatch($log->id);

        return $log;
    }

    public function deliver(SmsMessage $log): SmsMessage
    {
        if ($log->status === 'sent') {
            return $log;
        }

        try {
            $result = $this->gateway->send($log->recipient, $log->body, [
                'sender_id' => config('integrations.sms.providers.mnotify.sender_id'),
            ]);

            $status = ($result['status'] ?? '') === 'sent' ? 'sent' : 'failed';

            $log->update([
                'status' => $status,
                'sent_at' => $status === 'sent' ? now() : null,
                'response' => $result,
            ]);

            $this->recordUsage($log->tenant_id, $status);

            if ($status === 'sent' && $log->tenant_id) {
                try {
                    $this->wallet->debit(
                        $log->tenant_id,
                        1,
                        SmsWalletTransactionType::Usage,
                        'SMS sent',
                        $log->id,
                        ['recipient' => $log->recipient, 'type' => $log->type],
                    );
                } catch (\Throwable $e) {
                    Log::warning('SMS wallet debit failed after send', ['id' => $log->id, 'error' => $e->getMessage()]);
                }
            }

            $this->recordDeliveryLog($log, $status, $status === 'sent' ? 1 : 0, $result);
        } catch (\Throwable $e) {
            Log::warning('SMS delivery failed', ['id' => $log->id, 'error' => $e->getMessage()]);
            $log->update([
                'status' => 'failed',
                'response' => ['error' => $e->getMessage()],
            ]);
            $this->recordUsage($log->tenant_id, 'failed');
            $this->recordDeliveryLog($log, 'failed', 0, ['error' => $e->getMessage()]);
        }

        return $log->fresh();
    }

    public function tenantUsage(?int $tenantId, ?string $period = null): array
    {
        $period ??= TenantSmsUsage::currentPeriod();

        if (! $tenantId) {
            return [
                'period' => $period,
                'sent' => SmsMessage::query()->whereNull('tenant_id')->where('status', 'sent')->count(),
                'failed' => SmsMessage::query()->whereNull('tenant_id')->whereIn('status', ['failed', 'error'])->count(),
            ];
        }

        $row = TenantSmsUsage::query()
            ->withoutGlobalScope('tenant')
            ->where('tenant_id', $tenantId)
            ->where('period', $period)
            ->first();

        $wallet = $this->wallet->walletFor($tenantId);

        return [
            'period' => $period,
            'sent' => $row?->sent_count ?? 0,
            'failed' => $row?->failed_count ?? 0,
            'wallet_balance' => (int) $wallet->balance_credits,
            'low_balance_threshold' => (int) $wallet->low_balance_threshold,
            'is_low_balance' => $wallet->isLowBalance(),
            'total_used' => (int) $wallet->total_used,
            'total_purchased' => (int) $wallet->total_purchased,
        ];
    }

    /**
     * @param  array<string, mixed>|null  $providerResponse
     */
    protected function recordDeliveryLog(
        SmsMessage $log,
        string $status,
        int $creditsCharged,
        ?array $providerResponse = null,
    ): void {
        SmsDeliveryLog::query()->create([
            'tenant_id' => $log->tenant_id,
            'sms_message_id' => $log->id,
            'provider_message_id' => is_array($providerResponse) ? ($providerResponse['id'] ?? $providerResponse['message_id'] ?? null) : null,
            'recipient' => $log->recipient,
            'sender_id' => config('integrations.sms.providers.mnotify.sender_id'),
            'message_type' => $log->type ?? 'general',
            'status' => $status,
            'credits_charged' => $creditsCharged,
            'provider_response' => $providerResponse,
        ]);
    }

    protected function recordUsage(?int $tenantId, string $status): void
    {
        if (! $tenantId) {
            return;
        }

        $usage = TenantSmsUsage::query()
            ->withoutGlobalScope('tenant')
            ->firstOrCreate(
                [
                    'tenant_id' => $tenantId,
                    'period' => TenantSmsUsage::currentPeriod(),
                ],
                ['sent_count' => 0, 'failed_count' => 0]
            );

        if ($status === 'sent') {
            $usage->increment('sent_count');
        } else {
            $usage->increment('failed_count');
        }
    }
}
