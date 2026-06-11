<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>@yield('title', 'Ops Monitor') — {{ config('app.name') }}</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
@php($opsBase = '/' . trim(config('ops-monitor.path', 'ops'), '/'))

<body class="min-h-screen bg-slate-950 text-slate-100">
    @if (session('ops_monitor_authenticated'))
        <header class="border-b border-slate-800 bg-slate-900/80 backdrop-blur">
            <div class="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
                    <a href="{{ route('ops.dashboard') }}" class="text-sm font-bold tracking-tight text-white">
                        Ops Monitor
                    </a>
                    <nav class="flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-300">
                        <a href="{{ route('ops.dashboard') }}" class="hover:text-white">Overview</a>
                        <a href="{{ route('ops.system') }}" class="hover:text-white">System</a>
                        <a href="{{ route('ops.database') }}" class="hover:text-white">Database</a>
                        <a href="{{ route('ops.docs') }}" class="hover:text-white">API Docs</a>
                        <a href="{{ route('ops.routes') }}" class="hover:text-white">Route Health</a>
                        <a href="{{ route('ops.requests') }}" class="hover:text-white">Requests</a>
                        <a href="{{ route('ops.errors') }}" class="hover:text-white">Errors</a>
                        <a href="{{ route('ops.logs') }}" class="hover:text-white">Laravel Log</a>
                    </nav>
                </div>
                <form method="POST" action="{{ route('ops.logout') }}">
                    @csrf
                    <button type="submit" class="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800">
                        Sign out
                    </button>
                </form>
            </div>
        </header>
    @endif

    <main class="mx-auto max-w-7xl px-4 py-6">
        @yield('content')
    </main>
    @stack('scripts')
</body>
</html>
