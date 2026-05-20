<?php

namespace App\Models\Concerns;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

/**
 * PostgreSQL rejects boolean columns bound as integers (0/1).
 * Strip boolean attributes before INSERT/UPDATE, then apply with SQL TRUE/FALSE.
 */
trait FixesPgsqlBooleans
{
    /** @var array<string, bool> */
    protected array $pgsqlBooleanPatches = [];

    protected static function bootFixesPgsqlBooleans(): void
    {
        if (config('database.default') !== 'pgsql') {
            return;
        }

        static::saving(function (Model $model) {
            if (! in_array(FixesPgsqlBooleans::class, class_uses_recursive($model), true)) {
                return;
            }

            /** @var Model&FixesPgsqlBooleans $model */
            $model->pgsqlBooleanPatches = [];

            foreach ($model->getCasts() as $key => $cast) {
                if ($cast !== 'boolean' || ! array_key_exists($key, $model->getAttributes())) {
                    continue;
                }

                $model->pgsqlBooleanPatches[$key] = filter_var(
                    $model->getAttribute($key),
                    FILTER_VALIDATE_BOOLEAN
                );
                unset($model->attributes[$key]);
            }
        });

        static::saved(function (Model $model) {
            if (! in_array(FixesPgsqlBooleans::class, class_uses_recursive($model), true)) {
                return;
            }

            /** @var Model&FixesPgsqlBooleans $model */
            if ($model->pgsqlBooleanPatches === []) {
                return;
            }

            $updates = [];
            foreach ($model->pgsqlBooleanPatches as $key => $value) {
                $updates[$key] = DB::raw($value ? 'TRUE' : 'FALSE');
            }

            DB::table($model->getTable())
                ->where($model->getKeyName(), $model->getKey())
                ->update($updates);

            foreach ($model->pgsqlBooleanPatches as $key => $value) {
                $model->setAttribute($key, $value);
                $model->syncOriginalAttribute($key);
            }

            $model->pgsqlBooleanPatches = [];
        });
    }
}
