@extends('ops.layout')

@section('title', 'API Documentation')

@section('content')
    <div class="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
            <h1 class="text-2xl font-bold text-white">API documentation</h1>
            <p class="mt-1 text-sm text-slate-400">
                {{ number_format($total) }} endpoints · Base URL:
                <code class="rounded bg-slate-900 px-1.5 py-0.5 text-emerald-400">{{ $baseUrl }}</code>
            </p>
        </div>
        <a href="{{ route('ops.docs.export') }}"
           class="rounded-lg border border-emerald-700 bg-emerald-950/40 px-3 py-2 text-sm text-emerald-300 hover:bg-emerald-900/40">
            Download Markdown
        </a>
    </div>

    <div class="mb-6 grid gap-4 lg:grid-cols-3">
        <div class="rounded-xl border border-slate-800 bg-slate-900 p-4 lg:col-span-2">
            <h2 class="mb-3 font-semibold text-white">Authentication quick guide</h2>
            <div class="grid gap-3 text-sm sm:grid-cols-2">
                <div class="rounded-lg bg-slate-950 px-3 py-2">
                    <p class="font-medium text-slate-200">Web (Next.js)</p>
                    <p class="mt-1 text-slate-400">Session cookie via <code class="text-emerald-400">POST /auth/login</code></p>
                </div>
                <div class="rounded-lg bg-slate-950 px-3 py-2">
                    <p class="font-medium text-slate-200">Mobile / API token</p>
                    <p class="mt-1 text-slate-400"><code class="text-emerald-400">Authorization: Bearer {token}</code></p>
                </div>
                <div class="rounded-lg bg-slate-950 px-3 py-2">
                    <p class="font-medium text-slate-200">Tenant workspace</p>
                    <p class="mt-1 text-slate-400">Bearer + path <code class="text-emerald-400">/{tenantSlug}/…</code></p>
                </div>
                <div class="rounded-lg bg-slate-950 px-3 py-2">
                    <p class="font-medium text-slate-200">Public booking</p>
                    <p class="mt-1 text-slate-400"><code class="text-emerald-400">/booking/*</code> or <code class="text-emerald-400">/{tenantSlug}/book/*</code></p>
                </div>
            </div>
        </div>

        <div class="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <h2 class="mb-3 font-semibold text-white">Filter</h2>
            <form method="GET" class="space-y-3">
                <div>
                    <label class="mb-1 block text-xs text-slate-400">Search endpoints</label>
                    <input type="text" name="q" value="{{ $search }}" placeholder="e.g. appointments, finance"
                           class="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white">
                </div>
                <div>
                    <label class="mb-1 block text-xs text-slate-400">Section</label>
                    <select name="section" class="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white">
                        <option value="">All sections</option>
                        @foreach ($sections as $section)
                            <option value="{{ $section['key'] }}" @selected($activeSection === $section['key'])>
                                {{ $section['label'] }} ({{ $section['count'] }})
                            </option>
                        @endforeach
                    </select>
                </div>
                <div class="flex gap-2">
                    <button type="submit" class="rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white hover:bg-emerald-500">Apply</button>
                    <a href="{{ route('ops.docs') }}" class="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800">Reset</a>
                </div>
            </form>
        </div>
    </div>

    <div class="mb-4 flex flex-wrap gap-2">
        @foreach ($sections as $section)
            <a href="{{ route('ops.docs', ['section' => $section['key']]) }}"
               class="rounded-full border px-2.5 py-1 text-xs {{ $activeSection === $section['key'] ? 'border-emerald-600 bg-emerald-950/50 text-emerald-300' : 'border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white' }}">
                {{ $section['label'] }} ({{ $section['count'] }})
            </a>
        @endforeach
    </div>

    <p class="mb-3 text-sm text-slate-400">Showing {{ number_format(count($endpoints)) }} endpoint(s)</p>

    <div class="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900">
        <table class="min-w-full text-left text-sm">
            <thead class="border-b border-slate-800 text-xs uppercase text-slate-500">
                <tr>
                    <th class="px-3 py-3">Method</th>
                    <th class="px-3 py-3">Endpoint</th>
                    <th class="px-3 py-3">Auth</th>
                    <th class="px-3 py-3">Permission</th>
                    <th class="px-3 py-3">Handler</th>
                </tr>
            </thead>
            <tbody>
                @forelse ($endpoints as $endpoint)
                    <tr class="border-t border-slate-800 hover:bg-slate-950/60">
                        <td class="px-3 py-2 font-mono text-xs text-emerald-400">{{ implode(', ', $endpoint['methods']) }}</td>
                        <td class="px-3 py-2">
                            <code class="text-slate-200">{{ $endpoint['path'] }}</code>
                            <p class="text-xs text-slate-500">{{ $endpoint['section_label'] }}</p>
                        </td>
                        <td class="px-3 py-2 text-xs text-slate-300">{{ $endpoint['auth'] }}</td>
                        <td class="px-3 py-2 text-xs text-slate-400">{{ $endpoint['permission'] ?: '—' }}</td>
                        <td class="px-3 py-2 font-mono text-xs text-slate-500">{{ $endpoint['handler'] }}</td>
                    </tr>
                @empty
                    <tr><td colspan="5" class="px-4 py-8 text-center text-slate-500">No endpoints match your filters.</td></tr>
                @endforelse
            </tbody>
        </table>
    </div>
@endsection
