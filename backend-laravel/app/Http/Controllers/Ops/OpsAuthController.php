<?php

namespace App\Http\Controllers\Ops;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

class OpsAuthController extends Controller
{
    public function showLogin(): View|RedirectResponse
    {
        if (! config('ops-monitor.enabled')) {
            abort(404);
        }

        if (session('ops_monitor_authenticated') === true) {
            return redirect()->route('ops.dashboard');
        }

        return view('ops.login');
    }

    public function login(Request $request): RedirectResponse
    {
        $request->validate([
            'username' => ['required', 'string'],
            'password' => ['required', 'string'],
        ]);

        $username = (string) config('ops-monitor.username');
        $password = (string) config('ops-monitor.password');

        if (
            $request->input('username') !== $username
            || $request->input('password') !== $password
        ) {
            return back()->withErrors(['username' => 'Invalid credentials.'])->withInput();
        }

        $request->session()->regenerate();
        $request->session()->put('ops_monitor_authenticated', true);

        return redirect()->route('ops.dashboard');
    }

    public function logout(Request $request): RedirectResponse
    {
        $request->session()->forget('ops_monitor_authenticated');
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('ops.login');
    }
}
