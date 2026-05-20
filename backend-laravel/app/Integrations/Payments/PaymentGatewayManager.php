<?php

namespace App\Integrations\Payments;

use InvalidArgumentException;

class PaymentGatewayManager
{
    public function defaultProvider(): string
    {
        return config('billing.default_provider', 'paystack');
    }

    public function resolve(?string $provider = null): PaymentGatewayContract
    {
        $provider = $provider ?: $this->defaultProvider();

        return match ($provider) {
            'flutterwave' => app(FlutterwaveGateway::class),
            'paystack' => app(PaystackGateway::class),
            default => throw new InvalidArgumentException("Unsupported payment provider [{$provider}]."),
        };
    }
}
