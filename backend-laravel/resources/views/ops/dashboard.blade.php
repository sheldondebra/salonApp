@extends('ops.layout')

@section('title', 'Overview')

@section('content')
    <div class="mb-6">
        <h1 class="text-2xl font-bold text-white">System overview</h1>
        <p class="text-sm text-slate-400">Last 24 hours of API traffic</p>
        @if (($stats['total_requests_24h'] ?? 0) === 0)
            <p class="mt-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-300">
                No API requests logged yet. Use the Schedelux app (or call <code class="text-emerald-400">/api/v1/…</code> endpoints), then refresh this page.
            </p>
        @endif
    </div>

    @include('ops.partials.usage-charts', ['usageCharts' => $usageCharts])

    <div class="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div class="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <p class="text-xs text-slate-400">Environment</p>
            <p class="mt-1 text-xl font-bold {{ $system['app_env'] === 'production' ? 'text-amber-400' : 'text-emerald-400' }}">{{ strtoupper($system['app_env']) }}</p>
            <p class="mt-1 text-xs text-slate-500">DB {{ $system['db']['connected'] ? 'ok' : 'down' }} · {{ $system['db']['size'] ?? '—' }}</p>
        </div>
        <div class="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <p class="text-xs text-slate-400">Migrations</p>
            <p class="mt-1 text-xl font-bold {{ $migrations['pending_count'] > 0 ? 'text-amber-400' : 'text-emerald-400' }}">
                {{ $migrations['pending_count'] }} pending
            </p>
            <a href="{{ route('ops.database') }}" class="mt-1 inline-block text-xs text-emerald-400 hover:underline">Database details</a>
        </div>
        <div class="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <p class="text-xs text-slate-400">Failed jobs</p>
            <p class="mt-1 text-xl font-bold {{ $queue['failed_jobs'] > 0 ? 'text-red-400' : 'text-emerald-400' }}">{{ number_format($queue['failed_jobs']) }}</p>
            <a href="{{ route('ops.system') }}" class="mt-1 inline-block text-xs text-emerald-400 hover:underline">System details</a>
        </div>
        <div class="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <p class="text-xs text-slate-400">API documentation</p>
            <p class="mt-1 text-xl font-bold text-white">{{ number_format($apiEndpointCount) }}</p>
            <a href="{{ route('ops.docs') }}" class="mt-1 inline-block text-xs text-emerald-400 hover:underline">Browse API docs</a>
        </div>
    </div>

    <div class="mb-6">
        @include('ops.partials.operations-checklist', ['checks' => $operationsChecks])
    </div>

    <div class="mb-6">
        <div class="mb-3 flex items-center justify-between">
            <h2 class="font-semibold text-white">Data snapshot</h2>
            <a href="{{ route('ops.database') }}" class="text-xs text-emerald-400 hover:underline">All tables</a>
        </div>
        <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            @foreach (array_slice($metrics, 0, 5) as $metric)
                <div class="rounded-xl border border-slate-800 bg-slate-900 p-3">
                    <p class="text-xs text-slate-400">{{ $metric['label'] }}</p>
                    <p class="mt-1 text-lg font-bold text-white">{{ $metric['missing'] ? '—' : number_format($metric['count']) }}</p>
                </div>
            @endforeach
        </div>
    </div>

    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div class="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <p class="text-xs text-slate-400">Health score</p>
            <p class="mt-1 text-3xl font-bold text-emerald-400">{{ $stats['health_score'] }}%</p>
        </div>
        <div class="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <p class="text-xs text-slate-400">Requests (24h)</p>
            <p class="mt-1 text-3xl font-bold">{{ number_format($stats['total_requests_24h']) }}</p>
        </div>
        <div class="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <p class="text-xs text-slate-400">Errors (24h)</p>
            <p class="mt-1 text-3xl font-bold text-amber-400">{{ number_format($stats['errors_24h']) }}</p>
        </div>
        <div class="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <p class="text-xs text-slate-400">5xx errors (24h)</p>
            <p class="mt-1 text-3xl font-bold text-red-400">{{ number_format($stats['server_errors_24h']) }}</p>
        </div>
    </div>

    <div class="mt-4 grid gap-4 lg:grid-cols-3">
        <div class="rounded-xl border border-slate-800 bg-slate-900 p-4 lg:col-span-1">
            <p class="text-xs text-slate-400">Avg response time</p>
            <p class="mt-1 text-2xl font-semibold">{{ $stats['avg_duration_ms'] }} ms</p>
            <p class="mt-3 text-xs text-slate-500">{{ $stats['registered_api_routes'] }} registered API routes</p>
            <p class="text-xs text-slate-500">{{ $stats['routes_with_traffic_24h'] }} routes hit in 24h</p>
        </div>

        <div class="rounded-xl border border-slate-800 bg-slate-900 p-4 lg:col-span-2">
            <div class="mb-3 flex items-center justify-between">
                <h2 class="font-semibold text-white">Routes needing attention</h2>
                <a href="{{ route('ops.routes') }}" class="text-xs text-emerald-400 hover:underline">View all routes</a>
            </div>
            @if (count($failingRoutes) === 0)
                <p class="text-sm text-slate-400">No failing routes in the last 7 days.</p>
            @else
                <ul class="space-y-2 text-sm">
                    @foreach ($failingRoutes as $route)
                        <li class="flex items-center justify-between rounded-lg bg-slate-950 px-3 py-2">
                            <div>
                                <a href="{{ url('/' . trim(config('ops-monitor.path', 'ops'), '/') . '/routes/' . rawurlencode($route['name'])) }}" class="font-medium text-white hover:underline">
                                    {{ $route['name'] }}
                                </a>
                                <p class="text-xs text-slate-500">{{ implode(', ', $route['methods']) }} {{ $route['uri'] }}</p>
                            </div>
                            <span class="rounded-full px-2 py-0.5 text-xs {{ $route['health'] === 'failing' ? 'bg-red-900 text-red-300' : 'bg-amber-900 text-amber-300' }}">
                                {{ $route['errors'] }} errors
                            </span>
                        </li>
                    @endforeach
                </ul>
            @endif
        </div>
    </div>

    @if (count($logIssues) > 0)
        <div class="mt-6 rounded-xl border border-red-900/40 bg-slate-900 p-4">
            <div class="mb-3 flex items-center justify-between">
                <h2 class="font-semibold text-white">Recent app errors (log)</h2>
                <a href="{{ route('ops.system') }}" class="text-xs text-emerald-400 hover:underline">All log errors</a>
            </div>
            <ul class="space-y-2 text-sm">
                @foreach ($logIssues as $issue)
                    <li class="rounded-lg bg-slate-950 px-3 py-2">
                        <span class="text-xs text-slate-500">{{ $issue['timestamp'] }}</span>
                        <p class="mt-0.5 text-slate-200">{{ \Illuminate\Support\Str::limit($issue['message'], 160) }}</p>
                    </li>
                @endforeach
            </ul>
        </div>
    @endif

    <div class="mt-6 rounded-xl border border-slate-800 bg-slate-900 p-4">
        <div class="mb-3 flex items-center justify-between">
            <h2 class="font-semibold text-white">Recent API errors</h2>
            <a href="{{ route('ops.errors') }}" class="text-xs text-emerald-400 hover:underline">View all</a>
        </div>
        <div class="overflow-x-auto">
            <table class="min-w-full text-left text-sm">
                <thead class="text-xs uppercase text-slate-500">
                    <tr>
                        <th class="px-2 py-2">Time</th>
                        <th class="px-2 py-2">Status</th>
                        <th class="px-2 py-2">Route</th>
                        <th class="px-2 py-2">Message</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse ($recentErrors as $error)
                        <tr class="border-t border-slate-800">
                            <td class="px-2 py-2 text-slate-400">{{ $error['created_at'] }}</td>
                            <td class="px-2 py-2 font-mono">{{ $error['status_code'] }}</td>
                            <td class="px-2 py-2">{{ $error['route_name'] ?? $error['uri'] }}</td>
                            <td class="px-2 py-2 text-slate-300">{{ $error['error_message'] ?? '—' }}</td>
                        </tr>
                    @empty
                        <tr><td colspan="4" class="px-2 py-4 text-slate-500">No errors recorded yet.</td></tr>
                    @endforelse
                </tbody>
            </table>
        </div>
    </div>
@endsection
