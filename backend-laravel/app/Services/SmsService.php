<?php

namespace App\Services;

use App\Enums\SmsNotificationType;
use App\Integrations\Sms\SmsGatewayContract;
use App\Jobs\SendSmsJob;
use App\Models\SmsMessage;
use App\Models\TenantSmsUsage;
use Illuminate\Support\Facades\Log;

class SmsService
{
    public function __construct(
        protected SmsGatewayContract $gateway,
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
        } catch (\Throwable $e) {
            Log::warning('SMS delivery failed', ['id' => $log->id, 'error' => $e->getMessage()]);
            $log->update([
                'status' => 'failed',
                'response' => ['error' => $e->getMessage()],
            ]);
            $this->recordUsage($log->tenant_id, 'failed');
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

        return [
            'period' => $period,
            'sent' => $row?->sent_count ?? 0,
            'failed' => $row?->failed_count ?? 0,
        ];
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
