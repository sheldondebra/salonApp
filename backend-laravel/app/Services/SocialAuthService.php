<?php

namespace App\Services;

use App\Enums\UserType;
use App\Models\SocialAccount;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Contracts\User as SocialiteUser;

class SocialAuthService
{
    /** @var list<string> */
    public const PROVIDERS = ['google', 'facebook', 'apple'];

    public function redirectUrl(string $provider): string
    {
        $this->assertProvider($provider);

        if ($provider === 'apple') {
            throw new \RuntimeException('Apple Sign In requires additional OAuth setup. Use Google or Facebook for now.');
        }

        if (! config("services.{$provider}.client_id")) {
            throw new \RuntimeException(ucfirst($provider).' OAuth is not configured.');
        }

        return Socialite::driver($provider)->stateless()->redirect()->getTargetUrl();
    }

    public function handleCallback(string $provider): User
    {
        $this->assertProvider($provider);

        if ($provider === 'apple') {
            throw new \RuntimeException('Apple Sign In is not configured.');
        }

        /** @var SocialiteUser $socialUser */
        $socialUser = Socialite::driver($provider)->stateless()->user();

        $account = SocialAccount::query()
            ->where('provider', $provider)
            ->where('provider_id', $socialUser->getId())
            ->first();

        if ($account) {
            return $account->user;
        }

        $email = $socialUser->getEmail();

        $user = $email
            ? User::query()->where('email', $email)->first()
            : null;

        if (! $user) {
            $user = User::query()->create([
                'name' => $socialUser->getName() ?? Str::before($email ?? 'user', '@'),
                'email' => $email ?? "{$provider}_{$socialUser->getId()}@social.local",
                'password' => Hash::make(Str::random(32)),
                'user_type' => UserType::Client,
                'avatar_url' => $socialUser->getAvatar(),
                'is_active' => true,
            ]);
        }

        SocialAccount::query()->updateOrCreate(
            ['provider' => $provider, 'provider_id' => $socialUser->getId()],
            [
                'user_id' => $user->id,
                'provider_email' => $email,
                'avatar_url' => $socialUser->getAvatar(),
            ]
        );

        return $user;
    }

    protected function assertProvider(string $provider): void
    {
        if (! in_array($provider, self::PROVIDERS, true)) {
            throw new \InvalidArgumentException("Unsupported provider: {$provider}");
        }
    }
}
