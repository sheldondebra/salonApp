@extends('ops.layout')

@section('title', 'System')

@section('content')
    <div class="mb-6">
        <h1 class="text-2xl font-bold text-white">Backend system</h1>
        <p class="text-sm text-slate-400">Environment, services, queue, and application errors</p>
    </div>

    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div class="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <p class="text-xs text-slate-400">Environment</p>
            <p class="mt-1 text-xl font-bold {{ $system['app_env'] === 'production' ? 'text-amber-400' : 'text-emerald-400' }}">
                {{ strtoupper($system['app_env']) }}
            </p>
            <p class="mt-1 text-xs text-slate-500">Debug {{ $system['app_debug'] ? 'ON' : 'off' }}</p>
        </div>
        <div class="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <p class="text-xs text-slate-400">Database</p>
            <p class="mt-1 text-xl font-bold {{ $system['db']['connected'] ? 'text-emerald-400' : 'text-red-400' }}">
                {{ $system['db']['connected'] ? 'Connected' : 'Offline' }}
            </p>
            <p class="mt-1 text-xs text-slate-500">
                {{ $system['db']['latency_ms'] ?? '—' }} ms · {{ $system['db']['size'] ?? '—' }}
            </p>
        </div>
        <div class="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <p class="text-xs text-slate-400">Pending migrations</p>
            <p class="mt-1 text-xl font-bold {{ $migrations['pending_count'] > 0 ? 'text-amber-400' : 'text-emerald-400' }}">
                {{ $migrations['pending_count'] }}
            </p>
            <p class="mt-1 text-xs text-slate-500">{{ $migrations['applied_count'] }} applied</p>
        </div>
        <div class="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <p class="text-xs text-slate-400">Failed queue jobs</p>
            <p class="mt-1 text-xl font-bold {{ $queue['failed_jobs'] > 0 ? 'text-red-400' : 'text-emerald-400' }}">
                {{ number_format($queue['failed_jobs']) }}
            </p>
            <p class="mt-1 text-xs text-slate-500">{{ number_format($queue['pending_jobs']) }} pending</p>
        </div>
    </div>

    <div class="mb-6">
        @include('ops.partials.operations-checklist', ['checks' => $operationsChecks])
    </div>

    <div class="mt-6 grid gap-4 lg:grid-cols-2">
        <div class="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <h2 class="mb-3 font-semibold text-white">Runtime</h2>
            <dl class="space-y-2 text-sm">
                <div class="flex justify-between gap-4"><dt class="text-slate-400">App</dt><dd class="text-right text-slate-200">{{ $system['app_name'] }}</dd></div>
                <div class="flex justify-between gap-4"><dt class="text-slate-400">URL</dt><dd class="text-right text-slate-200">{{ $system['app_url'] }}</dd></div>
                <div class="flex justify-between gap-4"><dt class="text-slate-400">PHP</dt><dd class="text-right font-mono text-slate-200">{{ $system['php_version'] }}</dd></div>
                <div class="flex justify-between gap-4"><dt class="text-slate-400">Laravel</dt><dd class="text-right font-mono text-slate-200">{{ $system['laravel_version'] }}</dd></div>
                <div class="flex justify-between gap-4"><dt class="text-slate-400">Timezone</dt><dd class="text-right text-slate-200">{{ $system['timezone'] }}</dd></div>
                <div class="flex justify-between gap-4"><dt class="text-slate-400">Cache</dt><dd class="text-right text-slate-200">{{ $system['cache_driver'] }}</dd></div>
                <div class="flex justify-between gap-4"><dt class="text-slate-400">Session</dt><dd class="text-right text-slate-200">{{ $system['session_driver'] }}</dd></div>
                <div class="flex justify-between gap-4"><dt class="text-slate-400">Queue</dt><dd class="text-right text-slate-200">{{ $system['queue_driver'] }}</dd></div>
                <div class="flex justify-between gap-4"><dt class="text-slate-400">Mail</dt><dd class="text-right text-slate-200">{{ $system['mail_mailer'] }}</dd></div>
            </dl>
        </div>

        <div class="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <h2 class="mb-3 font-semibold text-white">Database connection</h2>
            @if (! $system['db']['connected'])
                <p class="rounded-lg bg-red-950/50 px-3 py-2 text-sm text-red-300">{{ $system['db']['error'] }}</p>
            @else
                <dl class="space-y-2 text-sm">
                    <div class="flex justify-between gap-4"><dt class="text-slate-400">Driver</dt><dd class="text-right text-slate-200">{{ $system['db']['driver'] }}</dd></div>
                    <div class="flex justify-between gap-4"><dt class="text-slate-400">Host</dt><dd class="text-right text-slate-200">{{ $system['db']['host'] ?? '—' }}</dd></div>
                    <div class="flex justify-between gap-4"><dt class="text-slate-400">Database</dt><dd class="text-right text-slate-200">{{ $system['db']['database'] ?? '—' }}</dd></div>
                    <div class="flex justify-between gap-4"><dt class="text-slate-400">Size</dt><dd class="text-right text-slate-200">{{ $system['db']['size'] ?? '—' }}</dd></div>
                    <div class="flex justify-between gap-4"><dt class="text-slate-400">Latency</dt><dd class="text-right text-slate-200">{{ $system['db']['latency_ms'] }} ms</dd></div>
                </dl>
            @endif

            <h3 class="mb-2 mt-5 text-sm font-semibold text-white">Server resources</h3>
            <dl class="space-y-2 text-sm">
                <div class="flex justify-between gap-4"><dt class="text-slate-400">Memory usage</dt><dd class="text-right text-slate-200">{{ $system['server']['memory_usage'] }} / {{ $system['server']['memory_limit'] }}</dd></div>
                <div class="flex justify-between gap-4"><dt class="text-slate-400">Memory peak</dt><dd class="text-right text-slate-200">{{ $system['server']['memory_peak'] }}</dd></div>
                <div class="flex justify-between gap-4"><dt class="text-slate-400">Disk free</dt><dd class="text-right text-slate-200">{{ $system['server']['disk_free'] ?? '—' }}</dd></div>
                <div class="flex justify-between gap-4"><dt class="text-slate-400">OPcache</dt><dd class="text-right text-slate-200">{{ ($system['server']['opcache_enabled'] ?? false) ? 'Enabled' : 'Off' }}</dd></div>
                <div class="flex justify-between gap-4"><dt class="text-slate-400">Maintenance</dt><dd class="text-right {{ $system['maintenance_mode'] ? 'text-amber-400' : 'text-emerald-400' }}">{{ $system['maintenance_mode'] ? 'ON' : 'Off' }}</dd></div>
            </dl>

            <h3 class="mb-2 mt-5 text-sm font-semibold text-white">Storage</h3>
            <dl class="space-y-2 text-sm">
                <div class="flex justify-between gap-4"><dt class="text-slate-400">Laravel log</dt><dd class="text-right text-slate-200">{{ $system['log']['size_human'] }}</dd></div>
                <div class="flex justify-between gap-4"><dt class="text-slate-400">Framework cache</dt><dd class="text-right text-slate-200">{{ $system['storage']['framework_cache'] }}</dd></div>
                <div class="flex justify-between gap-4"><dt class="text-slate-400">Sessions</dt><dd class="text-right text-slate-200">{{ $system['storage']['framework_sessions'] }}</dd></div>
            </dl>
        </div>
    </div>

    <div class="mt-6 rounded-xl border border-slate-800 bg-slate-900 p-4">
        <h2 class="mb-3 font-semibold text-white">Scheduled tasks (cron)</h2>
        <p class="mb-3 text-sm text-slate-400">Production servers need: <code class="rounded bg-slate-950 px-1.5 py-0.5 text-emerald-400">* * * * * cd /path/to/backend-laravel && php artisan schedule:run</code></p>
        <table class="min-w-full text-left text-sm">
            <thead class="text-xs uppercase text-slate-500">
                <tr>
                    <th class="px-2 py-2">Command</th>
                    <th class="px-2 py-2">Frequency</th>
                    <th class="px-2 py-2">Notes</th>
                </tr>
            </thead>
            <tbody>
                @foreach ($scheduledTasks as $task)
                    <tr class="border-t border-slate-800">
                        <td class="px-2 py-2 font-mono text-emerald-400">{{ $task['command'] }}</td>
                        <td class="px-2 py-2 text-slate-300">{{ $task['frequency'] }}</td>
                        <td class="px-2 py-2 text-slate-500">{{ $task['note'] }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    </div>

    @if ($migrations['pending_count'] > 0)
        <div class="mt-6 rounded-xl border border-amber-800/60 bg-amber-950/30 p-4">
            <h2 class="mb-2 font-semibold text-amber-200">Pending migrations ({{ $migrations['pending_count'] }})</h2>
            <p class="mb-3 text-sm text-amber-100/80">Run <code class="rounded bg-slate-950 px-1.5 py-0.5 text-emerald-400">php artisan migrate</code> on the server to apply schema updates.</p>
            <ul class="max-h-48 space-y-1 overflow-y-auto font-mono text-xs text-amber-100">
                @foreach ($migrations['pending'] as $migration)
                    <li>{{ $migration['name'] }}</li>
                @endforeach
            </ul>
        </div>
    @endif

    @if (count($queue['recent_failed']) > 0)
        <div class="mt-6 rounded-xl border border-slate-800 bg-slate-900 p-4">
            <h2 class="mb-3 font-semibold text-white">Recent failed jobs</h2>
            <ul class="space-y-2 text-sm">
                @foreach ($queue['recent_failed'] as $job)
                    <li class="rounded-lg bg-slate-950 px-3 py-2">
                        <div class="flex flex-wrap items-center justify-between gap-2">
                            <span class="font-mono text-xs text-slate-400">{{ $job['failed_at'] }}</span>
                            <span class="rounded-full bg-red-900/60 px-2 py-0.5 text-xs text-red-300">{{ $job['queue'] }}</span>
                        </div>
                        <p class="mt-1 text-slate-300">{{ $job['summary'] }}</p>
                    </li>
                @endforeach
            </ul>
        </div>
    @endif

    <div class="mt-6 rounded-xl border border-slate-800 bg-slate-900 p-4">
        <div class="mb-3 flex items-center justify-between">
            <h2 class="font-semibold text-white">Application errors (from log)</h2>
            <a href="{{ route('ops.logs') }}" class="text-xs text-emerald-400 hover:underline">Full log</a>
        </div>
        @if (count($logIssues) === 0)
            <p class="text-sm text-slate-400">No recent ERROR entries in laravel.log.</p>
        @else
            <ul class="space-y-3">
                @foreach ($logIssues as $issue)
                    <li class="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm">
                        <div class="flex flex-wrap items-center gap-2 text-xs">
                            <span class="text-slate-500">{{ $issue['timestamp'] }}</span>
                            <span class="rounded bg-red-900/60 px-1.5 py-0.5 font-mono text-red-300">{{ $issue['level'] }}</span>
                            <span class="text-slate-500">{{ $issue['channel'] }}</span>
                        </div>
                        <p class="mt-1 text-slate-200">{{ $issue['message'] }}</p>
                        @if ($issue['detail'])
                            <pre class="mt-2 overflow-x-auto text-xs text-slate-500">{{ $issue['detail'] }}</pre>
                        @endif
                    </li>
                @endforeach
            </ul>
        @endif
    </div>
@endsection
