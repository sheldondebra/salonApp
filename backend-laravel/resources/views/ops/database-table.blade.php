@extends('ops.layout')

@section('title', $meta['name'])

@section('content')
    @php
        $exportQuery = http_build_query(array_filter([
            'q' => $filters['q'] ?? null,
            'column' => $filters['column'] ?? null,
            'sort' => $filters['sort'] ?? null,
            'dir' => $filters['dir'] ?? null,
        ]));
    @endphp

    <div class="mb-6">
        <a href="{{ route('ops.database') }}" class="text-sm text-emerald-400 hover:underline">← All tables</a>
        <h1 class="mt-2 font-mono text-2xl font-bold text-white">{{ $meta['name'] }}</h1>
        <p class="text-sm text-slate-400">{{ number_format($meta['row_count']) }} rows · {{ count($meta['columns']) }} columns</p>
    </div>

    <div class="mb-6 flex flex-wrap gap-2">
        <a href="{{ route('ops.database.export', ['table' => $meta['name'], 'format' => 'csv']) }}{{ $exportQuery ? '?' . $exportQuery : '' }}"
           class="rounded-lg border border-emerald-700 bg-emerald-950/40 px-3 py-2 text-sm text-emerald-300 hover:bg-emerald-900/40">
            Export CSV
        </a>
        <a href="{{ route('ops.database.export', ['table' => $meta['name'], 'format' => 'json']) }}{{ $exportQuery ? '?' . $exportQuery : '' }}"
           class="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800">
            Export JSON
        </a>
        <span class="self-center text-xs text-slate-500">Exports respect current search · max {{ number_format(config('ops-monitor.export_max_rows', 50000)) }} rows</span>
    </div>

    <div class="mb-6 grid gap-4 lg:grid-cols-3">
        <div class="rounded-xl border border-slate-800 bg-slate-900 p-4 lg:col-span-2">
            <h2 class="mb-3 font-semibold text-white">Browse rows</h2>
            <form method="GET" class="grid gap-3 sm:grid-cols-4">
                <div class="sm:col-span-2">
                    <label class="mb-1 block text-xs text-slate-400">Search</label>
                    <input type="text" name="q" value="{{ $filters['q'] ?? '' }}" placeholder="Search text columns…"
                           class="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white">
                </div>
                <div>
                    <label class="mb-1 block text-xs text-slate-400">Column</label>
                    <select name="column" class="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white">
                        <option value="">All text columns</option>
                        @foreach ($meta['columns'] as $column)
                            <option value="{{ $column['name'] }}" @selected(($filters['column'] ?? '') === $column['name'])>{{ $column['name'] }}</option>
                        @endforeach
                    </select>
                </div>
                <div>
                    <label class="mb-1 block text-xs text-slate-400">Per page</label>
                    <select name="per_page" class="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white">
                        @foreach ([25, 50, 100] as $size)
                            <option value="{{ $size }}" @selected((int) ($filters['per_page'] ?? 50) === $size)>{{ $size }}</option>
                        @endforeach
                    </select>
                </div>
                <div class="flex items-end gap-2 sm:col-span-4">
                    <button type="submit" class="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500">Apply</button>
                    <a href="{{ route('ops.database.table', $meta['name']) }}" class="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800">Reset</a>
                </div>
            </form>
        </div>

        <div class="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <h2 class="mb-3 font-semibold text-white">Schema</h2>
            <div class="max-h-64 space-y-2 overflow-y-auto text-xs">
                @foreach ($meta['columns'] as $column)
                    <div class="rounded bg-slate-950 px-2 py-1.5">
                        <div class="flex items-center justify-between gap-2">
                            <span class="font-mono text-slate-200">{{ $column['name'] }}</span>
                            @if (! empty($column['primary']) || $column['name'] === ($meta['primary_key'] ?? null))
                                <span class="rounded bg-emerald-900/60 px-1.5 py-0.5 text-emerald-300">PK</span>
                            @endif
                        </div>
                        <p class="text-slate-500">{{ $column['type'] }}{{ $column['nullable'] ? '' : ' · NOT NULL' }}</p>
                    </div>
                @endforeach
            </div>
        </div>
    </div>

    <div class="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900">
        <table class="min-w-full text-left text-xs">
            <thead class="border-b border-slate-800 text-slate-500">
                <tr>
                    @foreach ($meta['columns'] as $column)
                        @php
                            $isSorted = ($filters['sort'] ?? $meta['primary_key']) === $column['name'];
                            $nextDir = $isSorted && ($filters['dir'] ?? 'desc') === 'desc' ? 'asc' : 'desc';
                            $sortUrl = route('ops.database.table', $meta['name']).'?'.http_build_query(array_filter([
                                'q' => $filters['q'] ?? null,
                                'column' => $filters['column'] ?? null,
                                'per_page' => $filters['per_page'] ?? null,
                                'sort' => $column['name'],
                                'dir' => $nextDir,
                            ]));
                        @endphp
                        <th class="whitespace-nowrap px-2 py-2">
                            <a href="{{ $sortUrl }}" class="hover:text-white">
                                {{ $column['name'] }}
                                @if ($isSorted)
                                    {{ ($filters['dir'] ?? 'desc') === 'asc' ? '↑' : '↓' }}
                                @endif
                            </a>
                        </th>
                    @endforeach
                </tr>
            </thead>
            <tbody>
                @forelse ($rows as $row)
                    <tr class="border-t border-slate-800 hover:bg-slate-950/60">
                        @foreach ($meta['columns'] as $column)
                            @php $value = $row[$column['name']] ?? null; @endphp
                            <td class="max-w-xs truncate px-2 py-2 font-mono text-slate-300" title="{{ $value }}">
                                {{ $value === null ? 'NULL' : \Illuminate\Support\Str::limit($value, 80) }}
                            </td>
                        @endforeach
                    </tr>
                @empty
                    <tr>
                        <td colspan="{{ count($meta['columns']) }}" class="px-4 py-8 text-center text-slate-500">No rows found.</td>
                    </tr>
                @endforelse
            </tbody>
        </table>
    </div>

    @if ($rows->hasPages())
        <div class="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-400">
            <p>
                Showing {{ $rows->firstItem() }}–{{ $rows->lastItem() }} of {{ number_format($rows->total()) }}
            </p>
            <div class="flex flex-wrap gap-2">
                @if ($rows->onFirstPage())
                    <span class="rounded border border-slate-800 px-3 py-1 text-slate-600">Previous</span>
                @else
                    <a href="{{ $rows->previousPageUrl() }}" class="rounded border border-slate-700 px-3 py-1 hover:bg-slate-800">Previous</a>
                @endif
                @if ($rows->hasMorePages())
                    <a href="{{ $rows->nextPageUrl() }}" class="rounded border border-slate-700 px-3 py-1 hover:bg-slate-800">Next</a>
                @else
                    <span class="rounded border border-slate-800 px-3 py-1 text-slate-600">Next</span>
                @endif
            </div>
        </div>
    @endif
@endsection
