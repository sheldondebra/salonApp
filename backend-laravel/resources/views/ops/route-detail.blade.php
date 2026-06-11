@extends('ops.layout')

@section('title', $route['name'])

@section('content')
    <div class="mb-6">
        <a href="{{ route('ops.routes') }}" class="text-xs text-emerald-400 hover:underline">← All routes</a>
        <h1 class="mt-2 text-2xl font-bold text-white">{{ $route['name'] }}</h1>
        <p class="font-mono text-sm text-slate-400">{{ implode(', ', $route['methods']) }} {{ $route['uri'] }}</p>
    </div>

    <div class="grid gap-4 lg:grid-cols-3">
        <div class="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <p class="text-xs text-slate-400">Health</p>
            <p class="mt-1 text-xl font-semibold capitalize">{{ $route['health'] }}</p>
        </div>
        <div class="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <p class="text-xs text-slate-400">Hits (7d)</p>
            <p class="mt-1 text-xl font-semibold">{{ $route['hits'] }}</p>
        </div>
        <div class="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <p class="text-xs text-slate-400">Errors (7d)</p>
            <p class="mt-1 text-xl font-semibold text-amber-400">{{ $route['errors'] }}</p>
        </div>
    </div>

    <div class="mt-4 grid gap-4 lg:grid-cols-2">
        <div class="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <h2 class="font-semibold text-white">Controller</h2>
            <p class="mt-2 break-all font-mono text-xs text-slate-300">{{ $route['action'] }}</p>
        </div>
        <div class="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <h2 class="font-semibold text-white">Middleware</h2>
            <ul class="mt-2 space-y-1 text-xs text-slate-300">
                @foreach ($route['middleware'] as $mw)
                    <li class="font-mono">{{ $mw }}</li>
                @endforeach
            </ul>
        </div>
    </div>

    <div class="mt-6 rounded-xl border border-slate-800 bg-slate-900 p-4">
        <h2 class="mb-3 font-semibold text-white">Recent requests</h2>
        <div class="overflow-x-auto">
            <table class="min-w-full text-left text-sm">
                <thead class="text-xs uppercase text-slate-500">
                    <tr>
                        <th class="px-2 py-2">Time</th>
                        <th class="px-2 py-2">Status</th>
                        <th class="px-2 py-2">Duration</th>
                        <th class="px-2 py-2">Tenant</th>
                        <th class="px-2 py-2">Error</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse ($route['recent'] as $log)
                        <tr class="border-t border-slate-800">
                            <td class="px-2 py-2 text-slate-400">{{ $log->created_at }}</td>
                            <td class="px-2 py-2 font-mono">{{ $log->status_code }}</td>
                            <td class="px-2 py-2">{{ $log->duration_ms }} ms</td>
                            <td class="px-2 py-2">{{ $log->tenant_slug ?? '—' }}</td>
                            <td class="px-2 py-2 text-slate-300">{{ $log->error_message ?? '—' }}</td>
                        </tr>
                    @empty
                        <tr><td colspan="5" class="px-2 py-4 text-slate-500">No requests logged for this route yet.</td></tr>
                    @endforelse
                </tbody>
            </table>
        </div>
    </div>
@endsection
