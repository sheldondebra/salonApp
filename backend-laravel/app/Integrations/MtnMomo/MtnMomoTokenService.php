<?php

namespace App\Integrations\MtnMomo;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class MtnMomoTokenService
{
    private const CACHE_PREFIX = 'mtn_momo_token:';

    /**
     * @param  array{api_user: ?string, api_key: ?string, subscription_key: ?string, target_environment: string, base_url: string, mock: bool}  $config
     */
    public function getToken(array $config): string
    {
        if ($config['mock'] ?? false) {
            return 'mock-mtn-token';
        }

        $cacheKey = self::CACHE_PREFIX.hash('sha256', ($config['api_user'] ?? '').($config['subscription_key'] ?? ''));

        return Cache::remember($cacheKey, 3300, function () use ($config) {
            $response = Http::withHeaders([
                'Ocp-Apim-Subscription-Key' => $config['subscription_key'],
            ])
                ->withBasicAuth((string) $config['api_user'], (string) $config['api_key'])
                ->post($config['base_url'].'/collection/token/');

            if (! $response->successful()) {
                throw new RuntimeException('MTN token request failed: '.$response->body());
            }

            $token = $response->json('access_token');

            if (! is_string($token) || $token === '') {
                throw new RuntimeException('MTN token response missing access_token.');
            }

            return $token;
        });
    }
}
