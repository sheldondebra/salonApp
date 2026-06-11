@extends('ops.layout')

@section('title', 'Login')

@section('content')
    <div class="mx-auto mt-16 max-w-md">
        <div class="rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-xl">
            <h1 class="text-2xl font-bold text-white">Ops Monitor</h1>
            <p class="mt-2 text-sm text-slate-400">
                API health, request logs, route catalog, and Laravel errors.
            </p>

            <form method="POST" action="{{ route('ops.login.submit') }}" class="mt-8 space-y-4">
                @csrf
                <div>
                    <label for="username" class="mb-1 block text-xs font-medium text-slate-400">Username</label>
                    <input
                        id="username"
                        name="username"
                        type="text"
                        value="{{ old('username') }}"
                        required
                        class="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                    >
                </div>
                <div>
                    <label for="password" class="mb-1 block text-xs font-medium text-slate-400">Password</label>
                    <input
                        id="password"
                        name="password"
                        type="password"
                        required
                        class="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                    >
                </div>

                @if ($errors->any())
                    <p class="rounded-lg bg-red-950/50 px-3 py-2 text-sm text-red-300">{{ $errors->first() }}</p>
                @endif

                <button type="submit" class="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500">
                    Sign in
                </button>
            </form>
        </div>
        <p class="mt-4 text-center text-xs text-slate-500">
            Default local: <code class="text-slate-400">ops / changeme</code> — set OPS_MONITOR_USERNAME and OPS_MONITOR_PASSWORD in .env
        </p>
    </div>
@endsection
