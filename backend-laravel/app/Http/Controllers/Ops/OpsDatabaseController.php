<?php

namespace App\Http\Controllers\Ops;

use App\Http\Controllers\Controller;
use App\Services\OpsDatabaseBrowserService;
use App\Services\OpsMonitorService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\View\View;
use Symfony\Component\HttpFoundation\StreamedResponse;

class OpsDatabaseController extends Controller
{
    public function __construct(
        private readonly OpsMonitorService $monitor,
        private readonly OpsDatabaseBrowserService $browser,
    ) {}

    public function index(Request $request): View
    {
        $search = Str::lower(trim((string) $request->query('q', '')));
        $tables = collect($this->monitor->databaseTables(500));

        if ($search !== '') {
            $tables = $tables->filter(fn (array $table) => str_contains(Str::lower($table['name']), $search))->values();
        }

        return view('ops.database', [
            'system' => $this->monitor->systemInfo(),
            'metrics' => $this->monitor->businessMetrics(),
            'tables' => $tables->all(),
            'migrations' => $this->monitor->migrationStatus(),
            'search' => $request->query('q', ''),
        ]);
    }

    public function show(Request $request, string $table): View
    {
        $meta = $this->browser->tableMeta($table);
        $filters = $request->only(['q', 'column', 'sort', 'dir', 'per_page']);

        return view('ops.database-table', [
            'meta' => $meta,
            'rows' => $this->browser->paginateRows($table, $filters),
            'filters' => $filters,
        ]);
    }

    public function export(Request $request, string $table): StreamedResponse
    {
        $format = Str::lower((string) $request->query('format', 'csv'));
        $filters = $request->only(['q', 'column', 'sort', 'dir']);
        $meta = $this->browser->tableMeta($table);
        $filename = $table.'-'.now()->format('Y-m-d-His');

        if ($format === 'json') {
            return $this->exportJson($table, $filename, $filters, $meta);
        }

        return $this->exportCsv($table, $filename, $filters);
    }

    /** @param array<string, mixed> $filters */
    protected function exportCsv(string $table, string $filename, array $filters): StreamedResponse
    {
        $columnNames = collect($this->browser->tableMeta($table)['columns'])->pluck('name')->all();

        return response()->streamDownload(function () use ($table, $filters, $columnNames) {
            $handle = fopen('php://output', 'w');
            if ($handle === false) {
                return;
            }

            fputcsv($handle, $columnNames);

            foreach ($this->browser->exportDataRows($table, $filters) as $row) {
                $line = [];
                foreach ($columnNames as $column) {
                    $line[] = $row[$column] ?? null;
                }
                fputcsv($handle, $line);
            }

            fclose($handle);
        }, $filename.'.csv', [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    /** @param array<string, mixed> $filters */
    /** @param array<string, mixed> $meta */
    protected function exportJson(string $table, string $filename, array $filters, array $meta): StreamedResponse
    {
        return response()->streamDownload(function () use ($table, $filters) {
            echo '[';
            $first = true;

            foreach ($this->browser->exportDataRows($table, $filters) as $record) {
                echo ($first ? '' : ',').json_encode($record, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
                $first = false;
            }

            echo ']';
        }, $filename.'.json', [
            'Content-Type' => 'application/json; charset=UTF-8',
        ]);
    }
}
