<?php

namespace App\Models\Concerns;

use Illuminate\Support\Str;

trait HasUuidRouteKey
{
    public function getRouteKeyName(): string
    {
        return 'uuid';
    }

    protected static function bootHasUuidRouteKey(): void
    {
        static::creating(function ($model) {
            $model->uuid ??= (string) Str::uuid();
        });
    }
}
