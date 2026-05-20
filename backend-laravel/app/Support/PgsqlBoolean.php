<?php

namespace App\Support;

use Illuminate\Database\Eloquent\Builder as EloquentBuilder;
use Illuminate\Database\Query\Builder as QueryBuilder;

class PgsqlBoolean
{
    public static function registerMacros(): void
    {
        $macro = function (string $column, bool $value = true) {
            if (config('database.default') !== 'pgsql') {
                return $this->where($column, $value);
            }

            $qualified = $column;
            if ($this instanceof EloquentBuilder && ! str_contains($column, '.')) {
                $qualified = $this->getModel()->qualifyColumn($column);
            }

            $quoted = implode('.', array_map(
                static fn (string $part) => '"'.$part.'"',
                explode('.', $qualified)
            ));

            return $this->whereRaw($value ? "{$quoted} IS TRUE" : "{$quoted} IS FALSE");
        };

        EloquentBuilder::macro('whereBool', $macro);
        QueryBuilder::macro('whereBool', $macro);
    }
}
