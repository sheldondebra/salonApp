@extends('ops.layout')

@section('title', 'Laravel Log')

@section('content')
    <div class="mb-6">
        <h1 class="text-2xl font-bold text-white">Laravel log tail</h1>
        <p class="text-sm text-slate-400">Last 250 lines from storage/logs/laravel.log</p>
    </div>

    <pre class="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 p-4 text-xs leading-relaxed text-slate-300">@foreach ($lines as $line){{ $line }}
@endforeach</pre>
@endsection
