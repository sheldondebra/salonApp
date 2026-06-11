@extends('ops.layout')

@section('title', 'API Routes')

@section('content')
    <div class="mb-6">
        <h1 class="text-2xl font-bold text-white">API route health</h1>
        <p class="text-sm text-slate-400">{{ count($routes) }} routes · traffic stats from last 7 days · <a href="{{ route('ops.docs') }}" class="text-emerald-400 hover:underline">Full API documentation</a></p>
    </div>

    <div class="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900">
        <table class="min-w-full text-left text-sm">
            <thead class="border-b border-slate-800 text-xs uppercase text-slate-500">
                <tr>
                    <th class="px-3 py-3">Health</th>
                    <th class="px-3 py-3">Methods</th>
                    <th class="px-3 py-3">Route</th>
                    <th class="px-3 py-3">Hits</th>
                    <th class="px-3 py-3">Errors</th>
                    <th class="px-3 py-3">Avg ms</th>
                    <th class="px-3 py-3">Last status</th>
                </tr>
            </thead>
            <tbody>
                @foreach ($routes as $route)
                    @php
                        $healthClass = match ($route['health']) {
                            'healthy' => 'bg-emerald-900 text-emerald-300',
                            'warning' => 'bg-amber-900 text-amber-300',
                            'degraded', 'failing' => 'bg-red-900 text-red-300',
                            default => 'bg-slate-800 text-slate-400',
                        };
                    @endphp
                    <tr class="border-t border-slate-800 hover:bg-slate-950/60">
                        <td class="px-3 py-2">
                            <span class="rounded-full px-2 py-0.5 text-xs {{ $healthClass }}">{{ $route['health'] }}</span>
                        </td>
                        <td class="px-3 py-2 font-mono text-xs text-slate-300">{{ implode(', ', $route['methods']) }}</td>
                        <td class="px-3 py-2">
                            <a href="{{ url('/' . trim(config('ops-monitor.path', 'ops'), '/') . '/routes/' . rawurlencode($route['name'])) }}" class="font-medium text-white hover:underline">
                                {{ $route['name'] }}
                            </a>
                            <p class="text-xs text-slate-500">{{ $route['uri'] }}</p>
                        </td>
                        <td class="px-3 py-2">{{ $route['hits'] }}</td>
                        <td class="px-3 py-2">{{ $route['errors'] }}</td>
                        <td class="px-3 py-2">{{ $route['avg_ms'] }}</td>
                        <td class="px-3 py-2 font-mono">{{ $route['last_status'] ?? '—' }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    </div>
@endsection
