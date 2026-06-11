@extends('ops.layout')

@section('title', 'Errors')

@section('content')
    <div class="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
            <h1 class="text-2xl font-bold text-white">API errors</h1>
            <p class="text-sm text-slate-400">
                {{ number_format($summary['total_errors_24h']) }} errors (24h) ·
                {{ number_format($summary['unique_issues']) }} unique issues ·
                {{ number_format($summary['errors_15m']) }} in last 15 min
            </p>
        </div>
        <div class="flex flex-wrap gap-2">
            <button type="button" id="ops-run-check"
                    class="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500">
                Run connectivity check
            </button>
            <button type="button" onclick="window.location.reload()"
                    class="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800">
                Reload page
            </button>
            <button type="button" id="ops-reset-watch"
                    class="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-400 hover:bg-slate-800">
                Reset watch timer
            </button>
        </div>
    </div>

    <div id="ops-check-result" class="mb-6 hidden rounded-xl border p-4 text-sm"></div>

    <div class="mb-6 grid gap-4 lg:grid-cols-3">
        <div class="rounded-xl border border-slate-800 bg-slate-900 p-4 lg:col-span-2">
            <h2 class="mb-3 font-semibold text-white">Live connectivity</h2>
            <p class="mb-3 text-xs text-slate-500">Watching for new errors since <span id="ops-watch-label">{{ $watchSince }}</span></p>
            <div class="grid gap-2 sm:grid-cols-3">
                @foreach ($connectivity['probes'] as $probe)
                    <div class="rounded-lg border px-3 py-2 {{ $probe['ok'] ? 'border-emerald-800/50 bg-emerald-950/30' : 'border-red-800/50 bg-red-950/30' }}">
                        <p class="text-xs text-slate-400">{{ $probe['label'] }}</p>
                        <p class="mt-1 font-medium {{ $probe['ok'] ? 'text-emerald-300' : 'text-red-300' }}">
                            {{ $probe['ok'] ? 'OK' : 'Failed' }}
                            @if ($probe['latency_ms'])
                                <span class="text-xs font-normal text-slate-500">({{ $probe['latency_ms'] }} ms)</span>
                            @endif
                        </p>
                        <p class="text-xs text-slate-500">{{ $probe['message'] }}</p>
                    </div>
                @endforeach
            </div>
        </div>
        <div class="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <h2 class="mb-3 font-semibold text-white">Since page load</h2>
            <dl class="space-y-2 text-sm">
                <div class="flex justify-between"><dt class="text-slate-400">New errors</dt><dd id="ops-new-errors" class="{{ $connectivity['new_errors_since_watch'] > 0 ? 'text-red-400' : 'text-emerald-400' }}">{{ $connectivity['new_errors_since_watch'] }}</dd></div>
                <div class="flex justify-between"><dt class="text-slate-400">New success</dt><dd id="ops-new-success" class="text-emerald-400">{{ $connectivity['new_success_since_watch'] }}</dd></div>
                <div class="flex justify-between"><dt class="text-slate-400">Fix signal</dt><dd id="ops-fix-signal" class="{{ $connectivity['fixed_signal'] ? 'text-emerald-400' : 'text-slate-400' }}">{{ $connectivity['fixed_signal'] ? 'Looks fixed ✓' : '—' }}</dd></div>
            </dl>
        </div>
    </div>

    <div class="mb-6 rounded-xl border border-slate-800 bg-slate-900 p-4">
        <h2 class="mb-3 font-semibold text-white">Client communication (last 30 min)</h2>
        <p class="mb-3 text-xs text-slate-500">Use your web app and mobile app, then run a check to verify traffic is reaching the API without errors.</p>
        <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            @foreach ($channelStats as $stat)
                @php
                    $boxClass = $stat['healthy'] === true ? 'border-emerald-800/50 bg-emerald-950/20' : ($stat['healthy'] === false ? 'border-red-800/50 bg-red-950/20' : 'border-slate-800 bg-slate-950');
                    $textClass = $stat['healthy'] === true ? 'text-emerald-300' : ($stat['healthy'] === false ? 'text-red-300' : 'text-slate-500');
                @endphp
                <div class="rounded-lg border px-3 py-2 {{ $boxClass }}">
                    <p class="text-xs text-slate-400">{{ $stat['label'] }}</p>
                    <p class="mt-1 text-lg font-bold {{ $textClass }}">
                        @if ($stat['total'] === 0)
                            No traffic
                        @elseif ($stat['healthy'])
                            OK
                        @else
                            {{ $stat['errors'] }} err
                        @endif
                    </p>
                    <p class="text-xs text-slate-500">{{ $stat['success'] }} ok / {{ $stat['total'] }} total</p>
                </div>
            @endforeach
        </div>
    </div>

    <div class="mb-6 rounded-xl border border-slate-800 bg-slate-900 p-4">
        <h2 class="mb-3 font-semibold text-white">All unique issues (grouped)</h2>
        <p class="mb-3 text-xs text-slate-500">Same route + error message grouped together. Fix an issue, use the app, then <strong class="text-slate-300">Run connectivity check</strong> — if no new errors appear, it is likely resolved.</p>
        <div class="overflow-x-auto">
            <table class="min-w-full text-left text-sm">
                <thead class="border-b border-slate-800 text-xs uppercase text-slate-500">
                    <tr>
                        <th class="px-3 py-2">Last seen</th>
                        <th class="px-3 py-2">Status</th>
                        <th class="px-3 py-2">Route / URI</th>
                        <th class="px-3 py-2">Error</th>
                        <th class="px-3 py-2 text-right">Count</th>
                        <th class="px-3 py-2">Clients</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse ($groupedErrors as $issue)
                        <tr class="border-t border-slate-800 align-top">
                            <td class="px-3 py-2 text-xs text-slate-400">{{ $issue->last_seen }}</td>
                            <td class="px-3 py-2 font-mono {{ $issue->last_status >= 500 ? 'text-red-400' : 'text-amber-400' }}">{{ $issue->last_status }}</td>
                            <td class="max-w-xs px-3 py-2 font-mono text-xs text-slate-300">{{ $issue->route_key }}</td>
                            <td class="max-w-md px-3 py-2 text-xs text-slate-300">{{ $issue->issue_key }}</td>
                            <td class="px-3 py-2 text-right font-semibold text-white">{{ number_format($issue->occurrences) }}</td>
                            <td class="px-3 py-2 text-xs text-slate-500">{{ $issue->channels ?? '—' }}</td>
                        </tr>
                    @empty
                        <tr><td colspan="6" class="px-3 py-6 text-center text-emerald-400">No API errors logged — looking good!</td></tr>
                    @endforelse
                </tbody>
            </table>
        </div>
    </div>

    @php
        $tableTitle = 'Full error log (all occurrences)';
        $showStatusFilter = true;
    @endphp
    @include('ops.partials.request-table', [
        'title' => $tableTitle,
        'requests' => $requests,
        'filters' => $filters,
        'watchSince' => $watchSince,
        'showStatusFilter' => true,
        'showChannelFilter' => true,
    ])
@endsection

@push('scripts')
<script>
(function () {
    const watchKey = 'ops_errors_watch_since';
    const urlParams = new URLSearchParams(window.location.search);
    let watchSince = urlParams.get('watch_since') || localStorage.getItem(watchKey) || @json($watchSince);

    const resultEl = document.getElementById('ops-check-result');
    const watchLabel = document.getElementById('ops-watch-label');

    function showResult(html, type) {
        resultEl.className = 'mb-6 rounded-xl border p-4 text-sm ' + (
            type === 'ok' ? 'border-emerald-800/60 bg-emerald-950/40 text-emerald-100' :
            type === 'warn' ? 'border-amber-800/60 bg-amber-950/40 text-amber-100' :
            'border-red-800/60 bg-red-950/40 text-red-100'
        );
        resultEl.innerHTML = html;
        resultEl.classList.remove('hidden');
    }

    function updateStats(data) {
        document.getElementById('ops-new-errors').textContent = data.new_errors_since_watch;
        document.getElementById('ops-new-errors').className = data.new_errors_since_watch > 0 ? 'text-red-400' : 'text-emerald-400';
        document.getElementById('ops-new-success').textContent = data.new_success_since_watch;
        document.getElementById('ops-fix-signal').textContent = data.fixed_signal ? 'Looks fixed ✓' : (data.new_errors_since_watch > 0 ? 'Still failing' : '—');
        document.getElementById('ops-fix-signal').className = data.fixed_signal ? 'text-emerald-400' : (data.new_errors_since_watch > 0 ? 'text-red-400' : 'text-slate-400');
    }

    async function runCheck() {
        showResult('Running connectivity check…', 'warn');
        try {
            const res = await fetch(@json(route('ops.errors.check')) + '?watch_since=' + encodeURIComponent(watchSince), {
                headers: { 'Accept': 'application/json' },
            });
            const data = await res.json();
            updateStats(data);

            const lines = [];
            lines.push('<p class="font-semibold">Check at ' + data.checked_at + '</p><ul class="mt-2 list-inside list-disc space-y-1">');
            data.probes.forEach(p => lines.push('<li>' + p.label + ': ' + (p.ok ? '<span class="text-emerald-300">OK</span>' : '<span class="text-red-300">' + p.message + '</span>') + '</li>'));
            lines.push('<li>Web/frontend: ' + (data.frontend_ok ? '<span class="text-emerald-300">communicating</span>' : '<span class="text-amber-300">no recent success or has errors</span>') + '</li>');
            lines.push('<li>Mobile app: ' + (data.mobile_ok ? '<span class="text-emerald-300">communicating</span>' : '<span class="text-amber-300">no recent success or has errors</span>') + '</li>');
            lines.push('<li>New errors since watch: <strong>' + data.new_errors_since_watch + '</strong>, new success: <strong>' + data.new_success_since_watch + '</strong></li>');
            lines.push('</ul>');
            if (data.overall_ok) {
                lines.push('<p class="mt-2 text-emerald-300">Overall: systems look healthy. Use the apps, then reload to refresh the error list.</p>');
            } else if (data.fixed_signal) {
                lines.push('<p class="mt-2 text-emerald-300">No new errors since watch started — your fix may have worked. Click <strong>Reload page</strong> to refresh the full error log.</p>');
            } else {
                lines.push('<p class="mt-2">Fix the issue, exercise the web/mobile app, then run this check again.</p>');
            }

            showResult(lines.join(''), data.overall_ok ? 'ok' : (data.new_errors_since_watch > 0 ? 'fail' : 'warn'));
        } catch (e) {
            showResult('Check failed: ' + e.message, 'fail');
        }
    }

    document.getElementById('ops-run-check')?.addEventListener('click', runCheck);

    document.getElementById('ops-reset-watch')?.addEventListener('click', function () {
        watchSince = new Date().toISOString();
        localStorage.setItem(watchKey, watchSince);
        watchLabel.textContent = watchSince;
        urlParams.set('watch_since', watchSince);
        window.history.replaceState({}, '', window.location.pathname + '?' + urlParams.toString());
        showResult('Watch timer reset. Use the app now, then run connectivity check to verify your fix.', 'warn');
        updateStats({ new_errors_since_watch: 0, new_success_since_watch: 0, fixed_signal: false });
    });

    if (!urlParams.get('watch_since')) {
        localStorage.setItem(watchKey, watchSince);
    }
    watchLabel.textContent = watchSince;
})();
</script>
@endpush
