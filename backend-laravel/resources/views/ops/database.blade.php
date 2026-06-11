@extends('ops.layout')

@section('title', 'Database')

@section('content')
    <div class="mb-6">
        <h1 class="text-2xl font-bold text-white">Database browser</h1>
        <p class="text-sm text-slate-400">
            {{ $system['db']['driver'] }} · {{ $system['db']['database'] ?? '—' }}
            @if ($system['db']['size'])
                · {{ $system['db']['size'] }}
            @endif
            · Read-only browse &amp; export
        </p>
    </div>

    @if ($migrations['pending_count'] > 0)
        <div class="mb-6 rounded-xl border border-amber-800/60 bg-amber-950/30 px-4 py-3 text-sm text-amber-100">
            <strong>{{ $migrations['pending_count'] }} migration(s) not applied.</strong>
            Run <code class="rounded bg-slate-950 px-1.5 py-0.5 text-emerald-400">php artisan migrate</code> to update the schema.
            <a href="{{ route('ops.system') }}" class="ml-2 text-emerald-400 hover:underline">View details</a>
        </div>
    @endif

    <div class="mb-6">
        <h2 class="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">Key tables</h2>
        <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            @foreach ($metrics as $metric)
                <a href="{{ $metric['missing'] ? '#' : route('ops.database.table', $metric['table']) }}"
                   class="rounded-xl border border-slate-800 bg-slate-900 p-4 {{ $metric['missing'] ? 'pointer-events-none opacity-50' : 'hover:border-emerald-800/60 hover:bg-slate-900/80' }}">
                    <p class="text-xs text-slate-400">{{ $metric['label'] }}</p>
                    <p class="mt-1 text-2xl font-bold {{ $metric['missing'] ? 'text-slate-600' : 'text-white' }}">
                        {{ $metric['missing'] ? '—' : number_format($metric['count']) }}
                    </p>
                    <p class="mt-1 font-mono text-xs text-emerald-400/80">{{ $metric['table'] }} →</p>
                </a>
            @endforeach
        </div>
    </div>

    <div class="grid gap-6 lg:grid-cols-3">
        <div class="rounded-xl border border-slate-800 bg-slate-900 p-4 lg:col-span-2">
            <div class="mb-3 flex flex-wrap items-center justify-between gap-3">
                <h2 class="font-semibold text-white">All tables (by row count)</h2>
                <form method="GET" class="flex gap-2">
                    <input type="text" name="q" value="{{ $search ?? '' }}" placeholder="Filter tables…"
                           class="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-sm text-white">
                    <button type="submit" class="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-800">Search</button>
                </form>
            </div>
            <div class="overflow-x-auto">
                <table class="min-w-full text-left text-sm">
                    <thead class="text-xs uppercase text-slate-500">
                        <tr>
                            <th class="px-2 py-2">Table</th>
                            <th class="px-2 py-2 text-right">Rows (approx)</th>
                            <th class="px-2 py-2 text-right">Size</th>
                            <th class="px-2 py-2 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        @forelse ($tables as $table)
                            <tr class="border-t border-slate-800 hover:bg-slate-950/50">
                                <td class="px-2 py-2">
                                    <a href="{{ route('ops.database.table', $table['name']) }}" class="font-mono text-emerald-400 hover:underline">{{ $table['name'] }}</a>
                                </td>
                                <td class="px-2 py-2 text-right text-slate-300">{{ number_format($table['rows']) }}</td>
                                <td class="px-2 py-2 text-right text-slate-500">{{ $table['size'] }}</td>
                                <td class="px-2 py-2 text-right">
                                    <a href="{{ route('ops.database.table', $table['name']) }}" class="text-xs text-slate-400 hover:text-white">Browse</a>
                                    <span class="text-slate-700">·</span>
                                    <a href="{{ route('ops.database.export', ['table' => $table['name'], 'format' => 'csv']) }}" class="text-xs text-slate-400 hover:text-white">CSV</a>
                                </td>
                            </tr>
                        @empty
                            <tr><td colspan="4" class="px-2 py-4 text-slate-500">No tables match your search.</td></tr>
                        @endforelse
                    </tbody>
                </table>
            </div>
        </div>

        <div class="space-y-6">
            <div class="rounded-xl border border-slate-800 bg-slate-900 p-4">
                <h2 class="mb-3 font-semibold text-white">Migration status</h2>
                <dl class="space-y-2 text-sm">
                    <div class="flex justify-between"><dt class="text-slate-400">Total files</dt><dd>{{ $migrations['total_files'] }}</dd></div>
                    <div class="flex justify-between"><dt class="text-slate-400">Applied</dt><dd class="text-emerald-400">{{ $migrations['applied_count'] }}</dd></div>
                    <div class="flex justify-between"><dt class="text-slate-400">Pending</dt><dd class="{{ $migrations['pending_count'] > 0 ? 'text-amber-400' : 'text-emerald-400' }}">{{ $migrations['pending_count'] }}</dd></div>
                </dl>
            </div>

            <div class="rounded-xl border border-slate-800 bg-slate-900 p-4">
                <h2 class="mb-3 font-semibold text-white">Recently applied</h2>
                @if (count($migrations['recent_applied']) === 0)
                    <p class="text-sm text-slate-400">No migrations recorded.</p>
                @else
                    <ul class="max-h-80 space-y-2 overflow-y-auto text-xs">
                        @foreach ($migrations['recent_applied'] as $migration)
                            <li class="rounded bg-slate-950 px-2 py-1.5">
                                <span class="font-mono text-slate-300">{{ $migration['name'] }}</span>
                                <span class="ml-2 text-slate-500">batch {{ $migration['batch'] }}</span>
                            </li>
                        @endforeach
                    </ul>
                @endif
            </div>

            @if ($migrations['pending_count'] > 0)
                <div class="rounded-xl border border-amber-800/60 bg-amber-950/20 p-4">
                    <h2 class="mb-2 font-semibold text-amber-200">Pending</h2>
                    <ul class="max-h-64 space-y-1 overflow-y-auto font-mono text-xs text-amber-100">
                        @foreach ($migrations['pending'] as $migration)
                            <li>{{ $migration['name'] }}</li>
                        @endforeach
                    </ul>
                </div>
            @endif
        </div>
    </div>
@endsection
