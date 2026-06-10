<?php

namespace App\Integrations\MtnMomo;

use Illuminate\Support\Facades\Http;
use RuntimeException;

class MtnMomoCollectionService
{
    public function __construct(
        protected MtnMomoTokenService $tokens,
    ) {}

    /**
     * @param  array{api_user: ?string, api_key: ?string, subscription_key: ?string, target_environment: string, base_url: string, mock: bool}  $config
     * @return array{ok: bool, status_code: int, body: mixed}
     */
    public function requestToPay(
        array $config,
        string $transactionUuid,
        string $partyId,
        string $amount,
        string $currency,
        string $externalId,
        string $payerMessage,
        string $payeeNote,
    ): array {
        if ($config['mock'] ?? false) {
            return ['ok' => true, 'status_code' => 202, 'body' => ['mock' => true]];
        }

        $token = $this->tokens->getToken($config);

        $response = Http::withHeaders([
            'Authorization' => 'Bearer '.$token,
            'X-Reference-Id' => $transactionUuid,
            'X-Target-Environment' => $config['target_environment'],
            'Ocp-Apim-Subscription-Key' => $config['subscription_key'],
            'Content-Type' => 'application/json',
        ])->post($config['base_url'].'/collection/v1_0/requesttopay', [
            'amount' => $amount,
            'currency' => $currency,
            'externalId' => $externalId,
            'payer' => [
                'partyIdType' => 'MSISDN',
                'partyId' => $partyId,
            ],
            'payerMessage' => $payerMessage,
            'payeeNote' => $payeeNote,
        ]);

        return [
            'ok' => $response->status() === 202,
            'status_code' => $response->status(),
            'body' => $response->json() ?? $response->body(),
        ];
    }

    /**
     * @param  array{api_user: ?string, api_key: ?string, subscription_key: ?string, target_environment: string, base_url: string, mock: bool}  $config
     * @return array{status: string, financialTransactionId: ?string, reason: ?string, raw: mixed}
     */
    public function getTransactionStatus(array $config, string $transactionUuid): array
    {
        if ($config['mock'] ?? false) {
            return [
                'status' => 'SUCCESSFUL',
                'financialTransactionId' => 'mock-'.substr($transactionUuid, 0, 8),
                'reason' => null,
                'raw' => ['mock' => true],
            ];
        }

        $token = $this->tokens->getToken($config);

        $response = Http::withHeaders([
            'Authorization' => 'Bearer '.$token,
            'X-Target-Environment' => $config['target_environment'],
            'Ocp-Apim-Subscription-Key' => $config['subscription_key'],
        ])->get($config['base_url'].'/collection/v1_0/requesttopay/'.$transactionUuid);

        if (! $response->successful()) {
            throw new RuntimeException('MTN status check failed: '.$response->body());
        }

        $data = $response->json();

        return [
            'status' => (string) ($data['status'] ?? 'PENDING'),
            'financialTransactionId' => $data['financialTransactionId'] ?? null,
            'reason' => isset($data['reason']) ? (string) $data['reason'] : null,
            'raw' => $data,
        ];
    }

    /** Ghana MSISDN for MTN API — digits only, no plus sign. */
    public static function formatPartyId(string $phone): string
    {
        $digits = preg_replace('/\D+/', '', $phone) ?? '';

        if (str_starts_with($digits, '0') && strlen($digits) === 10) {
            return '233'.substr($digits, 1);
        }

        if (str_starts_with($digits, '+')) {
            $digits = ltrim($digits, '+');
        }

        return $digits;
    }

    public static function formatAmount(int $amountCents): string
    {
        if ($amountCents % 100 === 0) {
            return (string) intdiv($amountCents, 100);
        }

        return number_format($amountCents / 100, 2, '.', '');
    }
}
