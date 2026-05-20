<?php

namespace App\Support;

use App\Enums\UserType;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Str;

class AdminRouteBindings
{
    public static function register(): void
    {
        $uuidPattern = '[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}';

        Route::pattern('user', $uuidPattern);
        Route::pattern('tenant', $uuidPattern);
        Route::pattern('uuid', $uuidPattern);

        Route::bind('user', function (string $value) {
            if (! Str::isUuid($value)) {
                abort(404);
            }

            $user = User::query()->withTrashed()->where('uuid', $value)->first();

            if (! $user || $user->user_type === UserType::Client) {
                abort(404);
            }

            return $user;
        });

        Route::bind('tenant', function (string $value) {
            if (! Str::isUuid($value)) {
                abort(404);
            }

            return Tenant::query()->where('uuid', $value)->firstOrFail();
        });
    }
}
