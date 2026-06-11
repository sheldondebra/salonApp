<div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
    <div>
        <h1 class="text-2xl font-bold text-white">{{ $title }}</h1>
        <p class="text-sm text-slate-400">{{ $requests->total() }} entries</p>
    </div>
    <form method="GET" class="flex flex-wrap gap-2">
        @if (!empty($watchSince))
            <input type="hidden" name="watch_since" value="{{ $watchSince }}">
        @endif
        <input
            type="search"
            name="q"
            value="{{ $filters['q'] ?? '' }}"
            placeholder="Search URI, route, error…"
            class="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
        >
        @if ($showStatusFilter ?? false)
            <select name="status" class="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white">
                <option value="errors" @selected(($filters['status'] ?? 'errors') === 'errors')>4xx+</option>
                <option value="5xx" @selected(($filters['status'] ?? '') === '5xx')>5xx only</option>
            </select>
        @endif
        @if ($showChannelFilter ?? false)
            <select name="channel" class="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white">
                <option value="">All clients</option>
                @foreach (['web' => 'Web', 'mobile' => 'Mobile', 'workspace' => 'Workspace', 'admin' => 'Admin', 'auth' => 'Auth', 'booking' => 'Booking'] as $val => $label)
                    <option value="{{ $val }}" @selected(($filters['channel'] ?? '') === $val)>{{ $label }}</option>
                @endforeach
            </select>
        @endif
        @if ($showChannelFilter ?? false)
            <select name="per_page" class="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white">
                @foreach ([50, 100, 200] as $size)
                    <option value="{{ $size }}" @selected((int) ($filters['per_page'] ?? 100) === $size)>{{ $size }} / page</option>
                @endforeach
            </select>
        @endif
        <button type="submit" class="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">Filter</button>
    </form>
</div>

<div class="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900">
    <table class="min-w-full text-left text-sm">
        <thead class="border-b border-slate-800 text-xs uppercase text-slate-500">
            <tr>
                <th class="px-3 py-3">Time</th>
                <th class="px-3 py-3">Method</th>
                <th class="px-3 py-3">Status</th>
                <th class="px-3 py-3">Route / URI</th>
                <th class="px-3 py-3">ms</th>
                <th class="px-3 py-3">Client</th>
                <th class="px-3 py-3">Error</th>
            </tr>
        </thead>
        <tbody>
            @forelse ($requests as $log)
                <tr class="border-t border-slate-800 align-top">
                    <td class="px-3 py-2 text-slate-400">{{ $log->created_at }}</td>
                    <td class="px-3 py-2 font-mono text-xs">{{ $log->method }}</td>
                    <td class="px-3 py-2 font-mono {{ $log->status_code >= 500 ? 'text-red-400' : ($log->status_code >= 400 ? 'text-amber-400' : 'text-emerald-400') }}">
                        {{ $log->status_code }}
                    </td>
                    <td class="px-3 py-2">
                        @if ($log->route_name)
                            <a href="{{ url('/' . trim(config('ops-monitor.path', 'ops'), '/') . '/routes/' . rawurlencode($log->route_name)) }}" class="text-white hover:underline">
                                {{ $log->route_name }}
                            </a>
                        @endif
                        <p class="text-xs text-slate-500">{{ $log->uri }}</p>
                    </td>
                    <td class="px-3 py-2">{{ $log->duration_ms }}</td>
                    <td class="px-3 py-2 text-xs text-slate-500">{{ $log->client_channel ?? '—' }}</td>
                    <td class="max-w-md px-3 py-2 text-xs text-slate-300">{{ $log->error_message ?? '—' }}</td>
                </tr>
            @empty
                <tr><td colspan="7" class="px-3 py-6 text-slate-500">No matching errors. If you fixed issues, reload the page to confirm.</td></tr>
            @endforelse
        </tbody>
    </table>
</div>

@if ($requests->hasPages())
    <div class="mt-4 flex items-center justify-between text-sm text-slate-400">
        <span>Page {{ $requests->currentPage() }} of {{ $requests->lastPage() }}</span>
        <div class="flex gap-2">
            @if ($requests->onFirstPage())
                <span class="rounded-lg border border-slate-800 px-3 py-1.5 opacity-40">Previous</span>
            @else
                <a href="{{ $requests->previousPageUrl() }}" class="rounded-lg border border-slate-700 px-3 py-1.5 hover:bg-slate-900">Previous</a>
            @endif
            @if ($requests->hasMorePages())
                <a href="{{ $requests->nextPageUrl() }}" class="rounded-lg border border-slate-700 px-3 py-1.5 hover:bg-slate-900">Next</a>
            @else
                <span class="rounded-lg border border-slate-800 px-3 py-1.5 opacity-40">Next</span>
            @endif
        </div>
    </div>
@endif
