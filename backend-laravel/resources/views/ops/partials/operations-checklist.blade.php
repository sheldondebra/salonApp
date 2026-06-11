@php
    $statusStyles = [
        'ok' => 'border-emerald-800/60 bg-emerald-950/30 text-emerald-300',
        'warn' => 'border-amber-800/60 bg-amber-950/30 text-amber-300',
        'fail' => 'border-red-800/60 bg-red-950/30 text-red-300',
    ];
    $dotStyles = [
        'ok' => 'bg-emerald-400',
        'warn' => 'bg-amber-400',
        'fail' => 'bg-red-400',
    ];
@endphp

<div class="rounded-xl border border-slate-800 bg-slate-900 p-4">
    <div class="mb-3 flex items-center justify-between">
        <h2 class="font-semibold text-white">Operations checklist</h2>
        <a href="{{ route('ops.system') }}" class="text-xs text-emerald-400 hover:underline">Full system</a>
    </div>
    <ul class="space-y-2">
        @foreach ($checks as $check)
            <li class="flex items-start gap-3 rounded-lg border px-3 py-2 text-sm {{ $statusStyles[$check['status']] ?? $statusStyles['warn'] }}">
                <span class="mt-1.5 h-2 w-2 shrink-0 rounded-full {{ $dotStyles[$check['status']] ?? $dotStyles['warn'] }}"></span>
                <div>
                    <p class="font-medium">{{ $check['label'] }}</p>
                    <p class="mt-0.5 text-xs opacity-90">{{ $check['detail'] }}</p>
                </div>
            </li>
        @endforeach
    </ul>
</div>
