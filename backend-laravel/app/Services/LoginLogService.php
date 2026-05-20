<?php

namespace App\Services;

use App\Models\User;
use App\Models\UserLoginLog;
use App\Support\UserAgentParser;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class LoginLogService
{
    public function recordSuccess(User $user, Request $request): void
    {
        try {
            $agent = $request->userAgent();
            $ip = $request->ip();

            $user->update([
                'last_login_at' => now(),
                'last_login_ip' => $ip,
                'last_login_user_agent' => $agent,
            ]);

            UserLoginLog::query()->create([
                'user_id' => $user->id,
                'ip_address' => $ip,
                'user_agent' => $agent,
                'device_label' => UserAgentParser::deviceLabel($agent),
                'status' => 'success',
                'logged_in_at' => now(),
            ]);
        } catch (\Throwable $e) {
            Log::warning('login_log.record_success_failed', ['user_id' => $user->id, 'error' => $e->getMessage()]);
        }
    }

    public function recordFailure(?User $user, Request $request, string $reason): void
    {
        if (! $user) {
            return;
        }

        $agent = $request->userAgent();

        UserLoginLog::query()->create([
            'user_id' => $user->id,
            'ip_address' => $request->ip(),
            'user_agent' => $agent,
            'device_label' => UserAgentParser::deviceLabel($agent),
            'status' => 'failed',
            'failure_reason' => $reason,
            'logged_in_at' => now(),
        ]);
    }
}
