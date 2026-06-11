<div class="mb-6 rounded-xl border border-slate-800 bg-slate-900 p-4">
    <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
            <h2 class="font-semibold text-white">API usage (last 24 hours)</h2>
            <p class="text-xs text-slate-400">Requests, errors, response time, and busiest routes</p>
        </div>
        <a href="{{ route('ops.requests') }}" class="text-xs text-emerald-400 hover:underline">View all requests →</a>
    </div>

    @if (! ($usageCharts['has_data'] ?? false))
        <div class="flex h-48 items-center justify-center rounded-lg border border-dashed border-slate-700 bg-slate-950 text-sm text-slate-500">
            No API traffic logged yet — use the app, then refresh.
        </div>
    @else
        <div class="grid gap-4 lg:grid-cols-3">
            <div class="lg:col-span-2">
                <canvas id="ops-hourly-chart" height="120"></canvas>
            </div>
            <div>
                <p class="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">Status codes (24h)</p>
                <canvas id="ops-status-chart" height="120"></canvas>
            </div>
        </div>

        <div class="mt-6 grid gap-4 lg:grid-cols-2">
            <div>
                <p class="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">Avg response time by hour (ms)</p>
                <canvas id="ops-latency-chart" height="80"></canvas>
            </div>
            <div>
                <p class="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">Top routes by traffic</p>
                <canvas id="ops-routes-chart" height="80"></canvas>
            </div>
        </div>
    @endif
</div>

@if ($usageCharts['has_data'] ?? false)
    @push('scripts')
        <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
        <script>
            (function () {
                const hourly = @json($usageCharts['hourly']);
                const status = @json($usageCharts['status_breakdown']);
                const routes = @json($usageCharts['top_routes']);

                const labels = hourly.map((b) => b.short_label);
                const gridColor = 'rgba(51, 65, 85, 0.5)';
                const tickColor = '#94a3b8';

                Chart.defaults.color = tickColor;
                Chart.defaults.borderColor = gridColor;
                Chart.defaults.font.family = 'ui-sans-serif, system-ui, sans-serif';

                new Chart(document.getElementById('ops-hourly-chart'), {
                    type: 'bar',
                    data: {
                        labels,
                        datasets: [
                            {
                                label: 'Requests',
                                data: hourly.map((b) => b.requests),
                                backgroundColor: 'rgba(16, 185, 129, 0.75)',
                                borderRadius: 4,
                                order: 2,
                            },
                            {
                                label: 'Errors (4xx+5xx)',
                                data: hourly.map((b) => b.errors),
                                backgroundColor: 'rgba(251, 191, 36, 0.9)',
                                borderRadius: 4,
                                order: 1,
                            },
                            {
                                label: '5xx',
                                data: hourly.map((b) => b.server_errors),
                                type: 'line',
                                borderColor: '#f87171',
                                backgroundColor: 'rgba(248, 113, 113, 0.15)',
                                tension: 0.3,
                                yAxisID: 'y',
                                order: 0,
                            },
                        ],
                    },
                    options: {
                        responsive: true,
                        interaction: { mode: 'index', intersect: false },
                        plugins: {
                            legend: { position: 'bottom', labels: { boxWidth: 12, padding: 16 } },
                        },
                        scales: {
                            x: { grid: { display: false } },
                            y: { beginAtZero: true, ticks: { precision: 0 } },
                        },
                    },
                });

                new Chart(document.getElementById('ops-status-chart'), {
                    type: 'doughnut',
                    data: {
                        labels: status.map((s) => s.label),
                        datasets: [{
                            data: status.map((s) => s.count),
                            backgroundColor: status.map((s) => s.color),
                            borderWidth: 0,
                        }],
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            legend: { position: 'bottom', labels: { boxWidth: 10, padding: 10, font: { size: 11 } } },
                        },
                    },
                });

                new Chart(document.getElementById('ops-latency-chart'), {
                    type: 'bar',
                    data: {
                        labels,
                        datasets: [{
                            label: 'Avg ms',
                            data: hourly.map((b) => b.avg_ms),
                            backgroundColor: 'rgba(96, 165, 250, 0.7)',
                            borderRadius: 4,
                        }],
                    },
                    options: {
                        responsive: true,
                        plugins: { legend: { display: false } },
                        scales: {
                            x: { grid: { display: false }, ticks: { maxTicksLimit: 12 } },
                            y: { beginAtZero: true },
                        },
                    },
                });

                const routeLabels = routes.map((r) => {
                    const name = r.route || 'unknown';
                    return name.length > 28 ? name.slice(0, 28) + '…' : name;
                });

                new Chart(document.getElementById('ops-routes-chart'), {
                    type: 'bar',
                    data: {
                        labels: routeLabels,
                        datasets: [
                            {
                                label: 'Hits',
                                data: routes.map((r) => r.hits),
                                backgroundColor: 'rgba(16, 185, 129, 0.75)',
                                borderRadius: 4,
                            },
                            {
                                label: 'Errors',
                                data: routes.map((r) => r.errors),
                                backgroundColor: 'rgba(248, 113, 113, 0.8)',
                                borderRadius: 4,
                            },
                        ],
                    },
                    options: {
                        indexAxis: 'y',
                        responsive: true,
                        plugins: {
                            legend: { position: 'bottom', labels: { boxWidth: 12 } },
                        },
                        scales: {
                            x: { beginAtZero: true, ticks: { precision: 0 } },
                            y: { grid: { display: false } },
                        },
                    },
                });
            })();
        </script>
    @endpush
@endif
