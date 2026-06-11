<?php

namespace App\Services;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class OpsDatabaseBrowserService
{
    /** @var Collection<int, string>|null */
    private ?Collection $tableNames = null;

    public function assertTableExists(string $table): void
    {
        if (! $this->tableNames()->contains($table)) {
            throw new NotFoundHttpException("Table [{$table}] not found.");
        }
    }

    /** @return Collection<int, string> */
    public function tableNames(): Collection
    {
        if ($this->tableNames !== null) {
            return $this->tableNames;
        }

        $driver = config('database.default');

        if ($driver === 'pgsql') {
            $rows = DB::select("
                SELECT tablename AS table_name
                FROM pg_catalog.pg_tables
                WHERE schemaname = 'public'
                ORDER BY tablename
            ");
        } elseif ($driver === 'mysql') {
            $database = config('database.connections.mysql.database');
            $rows = DB::select('
                SELECT table_name
                FROM information_schema.tables
                WHERE table_schema = ?
                ORDER BY table_name
            ', [$database]);
        } elseif ($driver === 'sqlite') {
            $rows = DB::select("
                SELECT name AS table_name
                FROM sqlite_master
                WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
                ORDER BY name
            ");
        } else {
            $rows = [];
        }

        $this->tableNames = collect($rows)->pluck('table_name')->values();

        return $this->tableNames;
    }

    /** @return array<string, mixed> */
    public function tableMeta(string $table): array
    {
        $this->assertTableExists($table);

        $columns = $this->tableColumns($table);
        $rowCount = (int) DB::table($table)->count();

        return [
            'name' => $table,
            'columns' => $columns,
            'row_count' => $rowCount,
            'primary_key' => $this->primaryKeyColumn($table, $columns),
        ];
    }

    /** @return list<array<string, mixed>> */
    public function tableColumns(string $table): array
    {
        $this->assertTableExists($table);
        $driver = config('database.default');

        if ($driver === 'pgsql') {
            $rows = DB::select('
                SELECT
                    column_name,
                    data_type,
                    udt_name,
                    is_nullable,
                    column_default,
                    character_maximum_length
                FROM information_schema.columns
                WHERE table_schema = \'public\' AND table_name = ?
                ORDER BY ordinal_position
            ', [$table]);
        } elseif ($driver === 'mysql') {
            $database = config('database.connections.mysql.database');
            $rows = DB::select('
                SELECT
                    column_name,
                    data_type,
                    data_type AS udt_name,
                    is_nullable,
                    column_default,
                    character_maximum_length
                FROM information_schema.columns
                WHERE table_schema = ? AND table_name = ?
                ORDER BY ordinal_position
            ', [$database, $table]);
        } elseif ($driver === 'sqlite') {
            $rows = DB::select('PRAGMA table_info('.self::quoteSqliteIdentifier($table).')');

            return collect($rows)->map(fn (object $row) => [
                'name' => $row->name,
                'type' => $row->type,
                'udt_name' => Str::lower($row->type),
                'nullable' => (int) $row->notnull === 0,
                'default' => $row->dflt_value,
                'max_length' => null,
                'primary' => (bool) $row->pk,
            ])->all();
        } else {
            return [];
        }

        return collect($rows)->map(fn (object $row) => [
            'name' => $row->column_name,
            'type' => $row->data_type,
            'udt_name' => $row->udt_name ?? $row->data_type,
            'nullable' => strtoupper((string) $row->is_nullable) === 'YES',
            'default' => $row->column_default,
            'max_length' => $row->character_maximum_length,
            'primary' => false,
        ])->all();
    }

    /** @param array<string, mixed> $filters */
    public function paginateRows(string $table, array $filters = []): LengthAwarePaginator
    {
        $meta = $this->tableMeta($table);
        $columns = collect($meta['columns']);
        $columnNames = $columns->pluck('name')->all();

        $perPage = min(100, max(10, (int) ($filters['per_page'] ?? 50)));
        $search = trim((string) ($filters['q'] ?? ''));
        $searchColumn = (string) ($filters['column'] ?? '');
        $orderBy = (string) ($filters['sort'] ?? $meta['primary_key'] ?? $columnNames[0] ?? 'id');
        $orderDir = strtolower((string) ($filters['dir'] ?? 'desc')) === 'asc' ? 'asc' : 'desc';

        if (! in_array($orderBy, $columnNames, true)) {
            $orderBy = $meta['primary_key'] ?? $columnNames[0];
        }

        $query = DB::table($table);
        $this->applySearch($query, $columns, $search, $searchColumn);

        return $query
            ->orderBy($orderBy, $orderDir)
            ->paginate($perPage)
            ->withQueryString()
            ->through(fn (object $row) => $this->formatRow($row));
    }

    /**
     * @param array<string, mixed> $filters
     * @return \Generator<int, array<string, string|null>>
     */
    public function exportDataRows(string $table, array $filters = []): \Generator
    {
        $meta = $this->tableMeta($table);
        $columns = collect($meta['columns']);
        $columnNames = $columns->pluck('name')->all();

        $search = trim((string) ($filters['q'] ?? ''));
        $searchColumn = (string) ($filters['column'] ?? '');
        $orderBy = (string) ($filters['sort'] ?? $meta['primary_key'] ?? $columnNames[0] ?? 'id');
        $orderDir = strtolower((string) ($filters['dir'] ?? 'desc')) === 'asc' ? 'asc' : 'desc';
        $maxRows = (int) config('ops-monitor.export_max_rows', 50000);

        if (! in_array($orderBy, $columnNames, true)) {
            $orderBy = $meta['primary_key'] ?? $columnNames[0];
        }

        $baseQuery = DB::table($table);
        $this->applySearch($baseQuery, $columns, $search, $searchColumn);

        $exported = 0;
        $offset = 0;
        $chunkSize = 500;

        while ($exported < $maxRows) {
            $rows = (clone $baseQuery)
                ->orderBy($orderBy, $orderDir)
                ->offset($offset)
                ->limit($chunkSize)
                ->get();

            if ($rows->isEmpty()) {
                break;
            }

            foreach ($rows as $row) {
                if ($exported >= $maxRows) {
                    return;
                }

                yield $this->formatRow($row);
                $exported++;
            }

            $offset += $chunkSize;
        }
    }

    /** @return array<string, string|null> */
    public function formatRow(object $row): array
    {
        $formatted = [];

        foreach ((array) $row as $key => $value) {
            if (is_array($value) || is_object($value)) {
                $formatted[$key] = json_encode($value, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

                continue;
            }

            if ($value === null) {
                $formatted[$key] = null;

                continue;
            }

            if (is_bool($value)) {
                $formatted[$key] = $value ? 'true' : 'false';

                continue;
            }

            $formatted[$key] = (string) $value;
        }

        return $formatted;
    }

    /** @param Collection<int, array<string, mixed>> $columns */
    protected function applySearch(\Illuminate\Database\Query\Builder $query, Collection $columns, string $search, string $searchColumn): void
    {
        if ($search === '') {
            return;
        }

        $columnNames = $columns->pluck('name')->all();
        $likeOperator = config('database.default') === 'pgsql' ? 'ilike' : 'like';
        $pattern = '%'.$search.'%';

        if ($searchColumn !== '' && in_array($searchColumn, $columnNames, true)) {
            $query->where($searchColumn, $likeOperator, $pattern);

            return;
        }

        $searchable = $columns->filter(fn (array $column) => $this->isSearchableType((string) ($column['udt_name'] ?? $column['type'] ?? '')));

        if ($searchable->isEmpty()) {
            return;
        }

        $query->where(function ($builder) use ($searchable, $likeOperator, $pattern) {
            foreach ($searchable as $column) {
                $builder->orWhere($column['name'], $likeOperator, $pattern);
            }
        });
    }

    protected function isSearchableType(string $type): bool
    {
        $type = Str::lower($type);

        return in_array($type, [
            'text', 'varchar', 'character varying', 'char', 'character',
            'uuid', 'json', 'jsonb', 'citext',
        ], true) || str_contains($type, 'char') || str_contains($type, 'text');
    }

    /** @param list<array<string, mixed>> $columns */
    protected function primaryKeyColumn(string $table, array $columns): ?string
    {
        foreach ($columns as $column) {
            if (! empty($column['primary'])) {
                return $column['name'];
            }
        }

        $names = array_column($columns, 'name');
        if (in_array('id', $names, true)) {
            return 'id';
        }

        if (in_array('uuid', $names, true)) {
            return 'uuid';
        }

        $driver = config('database.default');
        if ($driver === 'pgsql') {
            $rows = DB::select("
                SELECT a.attname AS column_name
                FROM pg_index i
                JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
                JOIN pg_class c ON c.oid = i.indrelid
                WHERE i.indisprimary AND c.relname = ?
                LIMIT 1
            ", [$table]);

            return $rows[0]->column_name ?? ($names[0] ?? null);
        }

        return $names[0] ?? null;
    }

    protected static function quoteSqliteIdentifier(string $identifier): string
    {
        return '"'.str_replace('"', '""', $identifier).'"';
    }
}
