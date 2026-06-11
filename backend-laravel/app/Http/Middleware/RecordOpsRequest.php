<?php

namespace App\Http\Middleware;

use App\Models\OpsRequestLog;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

class RecordOpsRequest
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! config('ops-monitor.enabled')) {
            return $next($request);
        }

        $request->attributes->set('ops_started_at', microtime(true));

        return $next($request);
    }

    public function terminate(Request $request, Response $response): void
    {
        if (! config('ops-monitor.enabled')) {
            return;
        }

        if ($this->shouldSkip($request)) {
            return;
        }

        try {
            $started = (float) $request->attributes->get('ops_started_at', microtime(true));
            $durationMs = (int) round((microtime(true) - $started) * 1000);
            $route = $request->route();
            $status = $response->getStatusCode();
            $excerpt = null;
            $errorMessage = null;

            if ($status >= 400) {
                $content = $response->getContent();
                if (is_string($content) && $content !== '') {
                    $decoded = json_decode($content, true);
                    if (is_array($decoded) && isset($decoded['message'])) {
                        $errorMessage = (string) $decoded['message'];
                    }
                    $excerpt = mb_substr($content, 0, (int) config('ops-monitor.max_body_length'));
                }
            }

            OpsRequestLog::query()->create([
                'method' => $request->method(),
                'uri' => '/'.ltrim($request->path(), '/'),
                'route_name' => $route?->getName(),
                'route_action' => $route ? (string) $route->getActionName() : null,
                'status_code' => $status,
                'duration_ms' => $durationMs,
                'user_id' => $request->user()?->id,
                'tenant_slug' => $request->header('X-Tenant-Slug') ?: $request->route('tenantSlug'),
                'ip' => $request->ip(),
                'user_agent' => Str::limit((string) $request->userAgent(), 512, ''),
                'client_channel' => $this->detectClientChannel($request),
                'error_message' => $errorMessage,
                'response_excerpt' => $excerpt,
                'created_at' => now(),
            ]);
        } catch (Throwable) {
            // Never break the app because monitoring failed.
        }
    }

    protected function detectClientChannel(Request $request): string
    {
        $path = '/'.ltrim($request->path(), '/');
        $ua = Str::lower((string) $request->userAgent());

        if (str_contains($path, '/api/v1/admin/')) {
            return 'admin';
        }

        if (str_contains($path, '/api/v1/auth/') || $path === '/api/v1/me') {
            return 'auth';
        }

        if (str_contains($path, '/book/') || str_contains($path, '/api/v1/booking/')) {
            return 'booking';
        }

        if (
            str_contains($ua, 'expo')
            || str_contains($ua, 'reactnative')
            || str_contains($ua, 'okhttp')
            || (str_contains($ua, 'darwin') && str_contains($ua, 'cfnetwork'))
        ) {
            return 'mobile';
        }

        if (str_contains($ua, 'mozilla') || str_contains($ua, 'chrome') || str_contains($ua, 'safari')) {
            return 'web';
        }

        if (preg_match('#/api/v1/[^/]+/#', $path)) {
            return 'workspace';
        }

        return 'api';
    }

    protected function shouldSkip(Request $request): bool
    {
        $path = $request->path();
        $monitorPath = trim((string) config('ops-monitor.path', 'ops'), '/');

        return str_starts_with($path, $monitorPath)
            || $path === 'up'
            || $path === 'sanctum/csrf-cookie';
    }
}
