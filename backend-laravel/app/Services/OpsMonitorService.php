<?php

namespace App\Services;

use App\Models\OpsRequestLog;
use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class OpsMonitorService
{
    /** @return array<string, mixed> */
    public function usageCharts(): array
    {
        $since = now()->subHours(23)->startOfHour();
        $hourly = $this->buildHourlyBuckets($since, 24);
        $driver = config('database.default');

        $bucketExpression = match ($driver) {
            'pgsql' => "date_trunc('hour', created_at)",
            'mysql' => "DATE_FORMAT(created_at, '%Y-%m-%d %H:00:00')",
            'sqlite' => "strftime('%Y-%m-%d %H:00:00', created_at)",
            default => "date_trunc('hour', created_at)",
        };

        try {
            $rows = DB::table('ops_request_logs')
                ->where('created_at', '>=', $since)
                ->selectRaw("{$bucketExpression} as bucket")
                ->selectRaw('COUNT(*) as requests')
                ->selectRaw('SUM(CASE WHEN status_code >= 400 THEN 1 ELSE 0 END) as errors')
                ->selectRaw('SUM(CASE WHEN status_code >= 500 THEN 1 ELSE 0 END) as server_errors')
                ->selectRaw('AVG(duration_ms) as avg_ms')
                ->groupBy('bucket')
                ->orderBy('bucket')
                ->get();

            foreach ($rows as $row) {
                $key = Carbon::parse($row->bucket)->format('Y-m-d H:00');
                if (! isset($hourly[$key])) {
                    continue;
                }

                $hourly[$key]['requests'] = (int) $row->requests;
                $hourly[$key]['errors'] = (int) $row->errors;
                $hourly[$key]['server_errors'] = (int) $row->server_errors;
                $hourly[$key]['avg_ms'] = (int) round((float) $row->avg_ms);
            }
        } catch (\Throwable) {
            // Keep zero-filled buckets if aggregation fails.
        }

        $hourlySeries = array_values($hourly);
        $maxRequests = max(1, ...array_column($hourlySeries, 'requests'));

        $statusRows = DB::table('ops_request_logs')
            ->where('created_at', '>=', now()->subDay())
            ->selectRaw("SUM(CASE WHEN status_code < 300 THEN 1 ELSE 0 END) as s2xx")
            ->selectRaw("SUM(CASE WHEN status_code >= 300 AND status_code < 400 THEN 1 ELSE 0 END) as s3xx")
            ->selectRaw("SUM(CASE WHEN status_code >= 400 AND status_code < 500 THEN 1 ELSE 0 END) as s4xx")
            ->selectRaw("SUM(CASE WHEN status_code >= 500 THEN 1 ELSE 0 END) as s5xx")
            ->first();

        $routeKey = $driver === 'pgsql'
            ? "COALESCE(NULLIF(route_name, ''), LEFT(uri, 80))"
            : "COALESCE(NULLIF(route_name, ''), SUBSTR(uri, 1, 80))";

        $topRoutes = DB::table('ops_request_logs')
            ->where('created_at', '>=', now()->subDay())
            ->selectRaw("{$routeKey} as route_key")
            ->selectRaw('COUNT(*) as hits')
            ->selectRaw('SUM(CASE WHEN status_code >= 400 THEN 1 ELSE 0 END) as errors')
            ->selectRaw('AVG(duration_ms) as avg_ms')
            ->groupBy('route_key')
            ->orderByDesc('hits')
            ->limit(10)
            ->get()
            ->map(fn (object $row) => [
                'route' => $row->route_key,
                'hits' => (int) $row->hits,
                'errors' => (int) $row->errors,
                'avg_ms' => (int) round((float) $row->avg_ms),
            ])
            ->all();

        $maxRouteHits = max(1, ...array_column($topRoutes, 'hits') ?: [1]);

        return [
            'hourly' => $hourlySeries,
            'max_requests' => $maxRequests,
            'status_breakdown' => [
                ['label' => '2xx Success', 'key' => '2xx', 'count' => (int) ($statusRows->s2xx ?? 0), 'color' => '#34d399'],
                ['label' => '3xx Redirect', 'key' => '3xx', 'count' => (int) ($statusRows->s3xx ?? 0), 'color' => '#60a5fa'],
                ['label' => '4xx Client error', 'key' => '4xx', 'count' => (int) ($statusRows->s4xx ?? 0), 'color' => '#fbbf24'],
                ['label' => '5xx Server error', 'key' => '5xx', 'count' => (int) ($statusRows->s5xx ?? 0), 'color' => '#f87171'],
            ],
            'top_routes' => $topRoutes,
            'max_route_hits' => $maxRouteHits,
            'has_data' => collect($hourlySeries)->sum('requests') > 0,
        ];
    }

    /** @return array<string, array<string, int|string>> */
    protected function buildHourlyBuckets(Carbon $start, int $hours): array
    {
        $buckets = [];

        for ($i = 0; $i < $hours; $i++) {
            $hour = $start->copy()->addHours($i);
            $key = $hour->format('Y-m-d H:00');
            $buckets[$key] = [
                'label' => $hour->format('H:i'),
                'short_label' => $hour->format('ga'),
                'requests' => 0,
                'errors' => 0,
                'server_errors' => 0,
                'avg_ms' => 0,
            ];
        }

        return $buckets;
    }

    /** @return array<string, mixed> */
    public function overviewStats(): array
    {
        $since = now()->subDay();

        $total24h = OpsRequestLog::query()->where('created_at', '>=', $since)->count();
        $errors24h = OpsRequestLog::query()
            ->where('created_at', '>=', $since)
            ->where('status_code', '>=', 400)
            ->count();
        $serverErrors24h = OpsRequestLog::query()
            ->where('created_at', '>=', $since)
            ->where('status_code', '>=', 500)
            ->count();
        $avgMs = (int) OpsRequestLog::query()
            ->where('created_at', '>=', $since)
            ->avg('duration_ms');

        $routes = $this->routeCatalog();
        $routesWithTraffic = (int) OpsRequestLog::query()
            ->where('created_at', '>=', $since)
            ->whereNotNull('route_name')
            ->selectRaw('COUNT(DISTINCT route_name) as aggregate')
            ->value('aggregate');

        return [
            'total_requests_24h' => $total24h,
            'errors_24h' => $errors24h,
            'server_errors_24h' => $serverErrors24h,
            'avg_duration_ms' => $avgMs,
            'registered_api_routes' => count($routes),
            'routes_with_traffic_24h' => $routesWithTraffic,
            'health_score' => $total24h > 0
                ? max(0, (int) round(100 - (($errors24h / $total24h) * 100)))
                : 100,
        ];
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function routeCatalog(): array
    {
        $since = now()->subDays(7);

        $stats = OpsRequestLog::query()
            ->select([
                'route_name',
                DB::raw('COUNT(*) as hits'),
                DB::raw('AVG(duration_ms) as avg_ms'),
                DB::raw('MAX(created_at) as last_called_at'),
                DB::raw('SUM(CASE WHEN status_code >= 400 THEN 1 ELSE 0 END) as errors'),
                DB::raw('MAX(status_code) as last_status'),
            ])
            ->where('created_at', '>=', $since)
            ->whereNotNull('route_name')
            ->groupBy('route_name')
            ->get()
            ->keyBy('route_name');

        $catalog = [];

        foreach (Route::getRoutes() as $route) {
            $uri = $route->uri();
            if (! str_starts_with($uri, 'api/')) {
                continue;
            }

            $name = $route->getName() ?? $uri;
            $stat = $stats->get($name);
            $methods = array_values(array_diff($route->methods(), ['HEAD']));
            $middleware = $route->gatherMiddleware();

            $catalog[] = [
                'name' => $name,
                'uri' => '/'.$uri,
                'methods' => $methods,
                'action' => (string) $route->getActionName(),
                'middleware' => $middleware,
                'hits' => (int) ($stat->hits ?? 0),
                'errors' => (int) ($stat->errors ?? 0),
                'avg_ms' => (int) round((float) ($stat->avg_ms ?? 0)),
                'last_status' => $stat?->last_status,
                'last_called_at' => $stat?->last_called_at,
                'health' => $this->routeHealth($stat),
            ];
        }

        usort($catalog, fn (array $a, array $b) => $b['errors'] <=> $a['errors'] ?: $b['hits'] <=> $a['hits']);

        return $catalog;
    }

    public function routeDetail(string $routeName): ?array
    {
        foreach ($this->routeCatalog() as $route) {
            if ($route['name'] === $routeName) {
                $route['recent'] = OpsRequestLog::query()
                    ->where('route_name', $routeName)
                    ->orderByDesc('id')
                    ->limit(25)
                    ->get();

                return $route;
            }
        }

        return null;
    }

    public function paginateRequests(array $filters = []): LengthAwarePaginator
    {
        $query = OpsRequestLog::query()->orderByDesc('id');

        if (! empty($filters['status'])) {
            if ($filters['status'] === 'errors') {
                $query->where('status_code', '>=', 400);
            } elseif ($filters['status'] === '5xx') {
                $query->where('status_code', '>=', 500);
            }
        }

        if (! empty($filters['route'])) {
            $query->where('route_name', $filters['route']);
        }

        if (! empty($filters['q'])) {
            $q = '%'.Str::lower($filters['q']).'%';
            $query->where(function ($builder) use ($q) {
                $builder->whereRaw('LOWER(uri) LIKE ?', [$q])
                    ->orWhereRaw('LOWER(route_name) LIKE ?', [$q])
                    ->orWhereRaw('LOWER(error_message) LIKE ?', [$q])
                    ->orWhereRaw('LOWER(client_channel) LIKE ?', [$q]);
            });
        }

        if (! empty($filters['channel'])) {
            $query->where('client_channel', $filters['channel']);
        }

        $perPage = min(200, max(25, (int) ($filters['per_page'] ?? 100)));

        return $query->paginate($perPage)->withQueryString();
    }

    /** @return array<string, mixed> */
    public function errorSummary(): array
    {
        $since24h = now()->subDay();
        $since15m = now()->subMinutes(15);

        return [
            'total_errors_24h' => OpsRequestLog::query()->where('created_at', '>=', $since24h)->where('status_code', '>=', 400)->count(),
            'server_errors_24h' => OpsRequestLog::query()->where('created_at', '>=', $since24h)->where('status_code', '>=', 500)->count(),
            'errors_15m' => OpsRequestLog::query()->where('created_at', '>=', $since15m)->where('status_code', '>=', 400)->count(),
            'success_15m' => OpsRequestLog::query()->where('created_at', '>=', $since15m)->where('status_code', '<', 400)->count(),
            'unique_issues' => $this->groupedErrors(100)->count(),
        ];
    }

    /** @return Collection<int, object> */
    public function groupedErrors(int $limit = 50): Collection
    {
        $routeKey = config('database.default') === 'pgsql'
            ? "COALESCE(NULLIF(route_name, ''), LEFT(uri, 120))"
            : "COALESCE(NULLIF(route_name, ''), SUBSTR(uri, 1, 120))";

        $messageKey = config('database.default') === 'pgsql'
            ? "COALESCE(NULLIF(error_message, ''), CONCAT('HTTP ', status_code::text))"
            : "COALESCE(NULLIF(error_message, ''), CONCAT('HTTP ', status_code))";

        return collect(DB::table('ops_request_logs')
            ->where('status_code', '>=', 400)
            ->selectRaw("{$routeKey} as route_key")
            ->selectRaw("{$messageKey} as issue_key")
            ->selectRaw('MAX(status_code) as last_status')
            ->selectRaw('COUNT(*) as occurrences')
            ->selectRaw('MAX(created_at) as last_seen')
            ->selectRaw('MIN(created_at) as first_seen')
            ->selectRaw("STRING_AGG(DISTINCT client_channel, ', ') as channels")
            ->groupBy('route_key', 'issue_key')
            ->orderByDesc('last_seen')
            ->limit($limit)
            ->get());
    }

    /** @return list<array<string, mixed>> */
    public function clientChannelStats(int $minutes = 15): array
    {
        $since = now()->subMinutes($minutes);
        $channels = ['web', 'mobile', 'workspace', 'admin', 'auth', 'booking', 'api'];

        $stats = [];
        foreach ($channels as $channel) {
            $base = OpsRequestLog::query()->where('created_at', '>=', $since)->where('client_channel', $channel);
            $total = (clone $base)->count();
            $errors = (clone $base)->where('status_code', '>=', 400)->count();
            $success = $total - $errors;

            $stats[] = [
                'channel' => $channel,
                'label' => $this->channelLabel($channel),
                'total' => $total,
                'success' => $success,
                'errors' => $errors,
                'healthy' => $total === 0 ? null : $errors === 0,
            ];
        }

        return $stats;
    }

    /**
     * @param string|null $watchSinceIso ISO timestamp from page load — errors after this are "new"
     * @return array<string, mixed>
     */
    public function connectivityCheck(?string $watchSinceIso = null): array
    {
        $watchSince = $watchSinceIso ? Carbon::parse($watchSinceIso) : now()->subMinutes(5);
        $probes = [];

        foreach ((array) config('ops-monitor.connectivity_probes', []) as $probe) {
            $path = $probe['path'] ?? '/api/v1/health';
            $result = $this->probeUrl($path);
            $probes[] = [
                'label' => $probe['label'] ?? $path,
                'path' => $path,
                'ok' => $result['ok'] && ($result['status'] ?? 0) === (int) ($probe['expect'] ?? 200),
                'message' => $result['message'],
                'latency_ms' => $result['latency_ms'] ?? null,
            ];
        }

        $newErrors = OpsRequestLog::query()
            ->where('created_at', '>=', $watchSince)
            ->where('status_code', '>=', 400)
            ->count();

        $newSuccess = OpsRequestLog::query()
            ->where('created_at', '>=', $watchSince)
            ->where('status_code', '<', 400)
            ->count();

        $channels = $this->clientChannelStats(15);
        $allProbesOk = collect($probes)->every(fn (array $p) => $p['ok']);
        $webOk = collect($channels)->firstWhere('channel', 'web')['healthy'] ?? null;
        $mobileOk = collect($channels)->firstWhere('channel', 'mobile')['healthy'] ?? null;
        $workspaceOk = collect($channels)->firstWhere('channel', 'workspace')['healthy'] ?? null;

        return [
            'checked_at' => now()->toIso8601String(),
            'watch_since' => $watchSince->toIso8601String(),
            'probes' => $probes,
            'probes_ok' => $allProbesOk,
            'new_errors_since_watch' => $newErrors,
            'new_success_since_watch' => $newSuccess,
            'fixed_signal' => $newErrors === 0 && $newSuccess > 0,
            'channels' => $channels,
            'frontend_ok' => $webOk === true || ($webOk === null && $workspaceOk === true),
            'mobile_ok' => $mobileOk === true || ($mobileOk === null && $workspaceOk === true),
            'workspace_ok' => $workspaceOk,
            'overall_ok' => $allProbesOk && $newErrors === 0 && ($webOk !== false && $mobileOk !== false),
        ];
    }

    /** @return array{ok: bool, message: string, status?: int, latency_ms?: int} */
    protected function probeUrl(string $path): array
    {
        try {
            $baseUrl = rtrim((string) config('app.url'), '/');
            $started = microtime(true);

            if ($this->shouldProbeInternally($baseUrl)) {
                return $this->probeInternally($path);
            }

            $response = Http::timeout(5)->get($baseUrl.$path);
            $latencyMs = (int) round((microtime(true) - $started) * 1000);

            return [
                'ok' => $response->successful(),
                'status' => $response->status(),
                'message' => 'HTTP '.$response->status(),
                'latency_ms' => $latencyMs,
            ];
        } catch (\Throwable $e) {
            return ['ok' => false, 'message' => 'Unreachable: '.$e->getMessage()];
        }
    }

    /** @return array{ok: bool, message: string, status?: int, latency_ms?: int} */
    protected function probeInternally(string $path): array
    {
        $started = microtime(true);
        $request = Request::create($path, 'GET');
        $route = app('router')->getRoutes()->match($request);
        $request->setRouteResolver(fn () => $route);

        // Run the matched action only — never boot the web session stack or the user gets logged out.
        $result = $route->run();
        $response = $result instanceof SymfonyResponse
            ? $result
            : response($result);
        $latencyMs = (int) round((microtime(true) - $started) * 1000);

        return [
            'ok' => $response->isSuccessful(),
            'status' => $response->getStatusCode(),
            'message' => 'HTTP '.$response->getStatusCode(),
            'latency_ms' => $latencyMs,
        ];
    }

    protected function shouldProbeInternally(string $baseUrl): bool
    {
        $host = parse_url($baseUrl, PHP_URL_HOST);
        if (! is_string($host) || $host === '') {
            return false;
        }

        return in_array(strtolower($host), ['localhost', '127.0.0.1', '0.0.0.0', '[::1]', '::1'], true);
    }

    protected function channelLabel(string $channel): string
    {
        return match ($channel) {
            'web' => 'Web (browser)',
            'mobile' => 'Mobile app',
            'workspace' => 'Tenant API (web/mobile)',
            'admin' => 'Admin portal',
            'auth' => 'Auth endpoints',
            'booking' => 'Public booking',
            default => 'Other API',
        };
    }

    /** @return list<string> */
    public function tailLaravelLog(int $lines = 200): array
    {
        $path = $this->resolveActiveLogPath();
        if ($path === null) {
            return ['Log file not found: storage/logs/laravel*.log'];
        }

        $size = filesize($path);
        if ($size === false || $size === 0) {
            return [];
        }

        // Read from the end of the file — never load multi-hundred-MB logs into memory.
        $lines = max(1, $lines);
        $chunkSize = min($size, 524288, max(65536, $lines * 512));
        $handle = fopen($path, 'rb');
        if ($handle === false) {
            return ['Could not open '.$this->logPathLabel($path)];
        }

        fseek($handle, -$chunkSize, SEEK_END);
        $content = fread($handle, $chunkSize);
        fclose($handle);

        if (! is_string($content) || $content === '') {
            return [];
        }

        $allLines = preg_split("/\r\n|\n|\r/", $content) ?: [];

        return array_slice($allLines, -$lines);
    }

    protected function resolveActiveLogPath(): ?string
    {
        $single = storage_path('logs/laravel.log');
        if (File::exists($single)) {
            return $single;
        }

        $dailyLogs = File::glob(storage_path('logs/laravel-*.log')) ?: [];
        if ($dailyLogs === []) {
            return null;
        }

        usort($dailyLogs, fn (string $a, string $b) => filemtime($b) <=> filemtime($a));

        return $dailyLogs[0];
    }

    protected function logPathLabel(string $path): string
    {
        $relative = str_replace(storage_path('logs').'/', 'storage/logs/', $path);

        return $relative !== $path ? $relative : $path;
    }

    /** @return list<array<string, mixed>> */
    public function recentErrors(int $limit = 20): array
    {
        return OpsRequestLog::query()
            ->where('status_code', '>=', 400)
            ->orderByDesc('id')
            ->limit($limit)
            ->get()
            ->map(fn (OpsRequestLog $log) => [
                'id' => $log->id,
                'method' => $log->method,
                'uri' => $log->uri,
                'route_name' => $log->route_name,
                'status_code' => $log->status_code,
                'error_message' => $log->error_message,
                'duration_ms' => $log->duration_ms,
                'created_at' => $log->created_at?->toDateTimeString(),
            ])
            ->all();
    }

    public function pruneOldLogs(): int
    {
        $cutoff = now()->subDays((int) config('ops-monitor.retention_days', 14));

        return OpsRequestLog::query()->where('created_at', '<', $cutoff)->delete();
    }

    /** @return array<string, mixed> */
    public function systemInfo(): array
    {
        $dbConnected = false;
        $dbLatencyMs = null;
        $dbError = null;

        try {
            $started = microtime(true);
            DB::select('SELECT 1');
            $dbConnected = true;
            $dbLatencyMs = (int) round((microtime(true) - $started) * 1000);
        } catch (\Throwable $e) {
            $dbError = $e->getMessage();
        }

        $logPath = $this->resolveActiveLogPath();
        $logSize = $logPath !== null ? (filesize($logPath) ?: 0) : 0;

        return [
            'app_name' => config('app.name'),
            'app_env' => config('app.env'),
            'app_debug' => (bool) config('app.debug'),
            'app_url' => config('app.url'),
            'php_version' => PHP_VERSION,
            'laravel_version' => app()->version(),
            'timezone' => config('app.timezone'),
            'cache_driver' => config('cache.default'),
            'session_driver' => config('session.driver'),
            'queue_driver' => config('queue.default'),
            'mail_mailer' => config('mail.default'),
            'ops_enabled' => (bool) config('ops-monitor.enabled'),
            'db' => [
                'connected' => $dbConnected,
                'latency_ms' => $dbLatencyMs,
                'error' => $dbError,
                'driver' => config('database.default'),
                'host' => config('database.connections.'.config('database.default').'.host'),
                'database' => config('database.connections.'.config('database.default').'.database'),
                'size' => $this->databaseSize(),
            ],
            'log' => [
                'path' => $logPath !== null ? $this->logPathLabel($logPath) : 'storage/logs/laravel.log',
                'size_bytes' => $logSize,
                'size_human' => $this->formatBytes((int) $logSize),
            ],
            'storage' => [
                'framework_cache' => $this->directorySize(storage_path('framework/cache')),
                'framework_sessions' => $this->directorySize(storage_path('framework/sessions')),
            ],
            'server' => $this->serverResources(),
            'maintenance_mode' => app()->isDownForMaintenance(),
        ];
    }

    /** @return array<string, mixed> */
    public function serverResources(): array
    {
        $storagePath = storage_path();
        $diskFree = @disk_free_space($storagePath);
        $diskTotal = @disk_total_space($storagePath);

        return [
            'memory_limit' => ini_get('memory_limit') ?: '—',
            'memory_usage' => $this->formatBytes(memory_get_usage(true)),
            'memory_peak' => $this->formatBytes(memory_get_peak_usage(true)),
            'max_execution_time' => ini_get('max_execution_time').'s',
            'disk_free' => $diskFree !== false ? $this->formatBytes((int) $diskFree) : null,
            'disk_total' => $diskTotal !== false ? $this->formatBytes((int) $diskTotal) : null,
            'disk_used_percent' => ($diskFree !== false && $diskTotal !== false && $diskTotal > 0)
                ? (int) round((1 - ($diskFree / $diskTotal)) * 100)
                : null,
            'opcache_enabled' => (function () {
                if (! function_exists('opcache_get_status')) {
                    return false;
                }
                $status = opcache_get_status(false);

                return is_array($status) && ($status['opcache_enabled'] ?? false);
            })(),
        ];
    }

    /** @return list<array<string, mixed>> */
    public function scheduledTasks(): array
    {
        return [
            ['command' => 'bookings:send-reminders', 'frequency' => 'Every hour', 'note' => 'Requires cron: * * * * * php artisan schedule:run'],
            ['command' => 'ops:prune-logs', 'frequency' => 'Daily', 'note' => 'Cleans old ops_request_logs rows'],
        ];
    }

    /** @return list<array<string, mixed>> */
    public function operationsChecklist(): array
    {
        $system = $this->systemInfo();
        $migrations = $this->migrationStatus();
        $queue = $this->queueStatus();
        $cache = $this->cacheHealth();
        $apiProbe = $this->probeUrl('/api/v1/health');
        $upProbe = $this->probeUrl('/up');
        $logBytes = (int) ($system['log']['size_bytes'] ?? 0);

        $checks = [
            $this->check('Database connection', $system['db']['connected'] ? 'ok' : 'fail', $system['db']['connected'] ? 'Responding in '.$system['db']['latency_ms'].'ms' : ($system['db']['error'] ?? 'Offline')),
            $this->check('API `/api/v1/health`', $apiProbe['ok'] ? 'ok' : 'warn', $apiProbe['message']),
            $this->check('Laravel `/up` probe', $upProbe['ok'] ? 'ok' : 'warn', $upProbe['message']),
            $this->check('Cache read/write', $cache['ok'] ? 'ok' : 'fail', $cache['message']),
            $this->check('Pending migrations', $migrations['pending_count'] === 0 ? 'ok' : 'warn', $migrations['pending_count'] === 0 ? 'Schema up to date' : $migrations['pending_count'].' migration(s) need `php artisan migrate`'),
            $this->check('Failed queue jobs', $queue['failed_jobs'] === 0 ? 'ok' : 'warn', $queue['failed_jobs'] === 0 ? 'No failures' : number_format($queue['failed_jobs']).' failed job(s)'),
            $this->check('Maintenance mode', ! $system['maintenance_mode'] ? 'ok' : 'warn', $system['maintenance_mode'] ? 'Application is down for maintenance' : 'Not in maintenance'),
            $this->check('Debug mode', (! $system['app_debug'] || $system['app_env'] !== 'production') ? 'ok' : 'warn', $system['app_debug'] ? 'APP_DEBUG=true' : 'APP_DEBUG=false'),
            $this->check('Log file size', $logBytes < 50 * 1048576 ? 'ok' : 'warn', $system['log']['size_human'].' — consider rotating if very large'),
            $this->check('Disk space (storage)', ($system['server']['disk_used_percent'] ?? 0) < 90 ? 'ok' : 'warn', ($system['server']['disk_free'] ?? '—').' free of '.($system['server']['disk_total'] ?? '—')),
            $this->check('Ops monitor exposure', ($system['app_env'] !== 'production' || ! $system['ops_enabled']) ? 'ok' : 'warn', $system['ops_enabled'] ? 'Enabled — protect with strong OPS_MONITOR_PASSWORD' : 'Disabled'),
        ];

        return $checks;
    }

    /** @return array{ok: bool, message: string} */
    public function cacheHealth(): array
    {
        try {
            $key = 'ops_monitor_cache_probe_'.Str::random(8);
            Cache::put($key, 'ok', 10);
            $value = Cache::get($key);
            Cache::forget($key);

            if ($value !== 'ok') {
                return ['ok' => false, 'message' => 'Cache driver '.config('cache.default').' did not persist a test value'];
            }

            return ['ok' => true, 'message' => 'Driver: '.config('cache.default')];
        } catch (\Throwable $e) {
            return ['ok' => false, 'message' => $e->getMessage()];
        }
    }

    /** @return array{label: string, status: string, detail: string} */
    protected function check(string $label, string $status, string $detail): array
    {
        return compact('label', 'status', 'detail');
    }

    /** @return array<string, mixed> */
    public function queueStatus(): array
    {
        $hasJobs = Schema::hasTable('jobs');
        $hasFailed = Schema::hasTable('failed_jobs');

        return [
            'pending_jobs' => $hasJobs ? (int) DB::table('jobs')->count() : 0,
            'failed_jobs' => $hasFailed ? (int) DB::table('failed_jobs')->count() : 0,
            'recent_failed' => $hasFailed ? $this->recentFailedJobs(8) : [],
        ];
    }

    /** @return list<array<string, mixed>> */
    public function recentFailedJobs(int $limit = 10): array
    {
        if (! Schema::hasTable('failed_jobs')) {
            return [];
        }

        return DB::table('failed_jobs')
            ->orderByDesc('failed_at')
            ->limit($limit)
            ->get(['id', 'uuid', 'queue', 'connection', 'failed_at', 'exception'])
            ->map(function (object $job) {
                $exception = (string) ($job->exception ?? '');
                $firstLine = Str::of($exception)->before("\n")->limit(180)->value();

                return [
                    'id' => $job->id,
                    'uuid' => $job->uuid,
                    'queue' => $job->queue,
                    'connection' => $job->connection,
                    'failed_at' => $job->failed_at,
                    'summary' => $firstLine,
                ];
            })
            ->all();
    }

    /** @return array<string, mixed> */
    public function migrationStatus(): array
    {
        $files = collect(File::glob(database_path('migrations/*.php')))
            ->map(fn (string $path) => pathinfo($path, PATHINFO_FILENAME))
            ->sort()
            ->values();

        $ran = DB::table('migrations')
            ->orderBy('batch')
            ->orderBy('migration')
            ->get()
            ->keyBy('migration');

        $pending = [];
        $applied = [];

        foreach ($files as $file) {
            if ($ran->has($file)) {
                $row = $ran->get($file);
                $applied[] = [
                    'name' => $file,
                    'batch' => (int) $row->batch,
                ];
            } else {
                $pending[] = ['name' => $file];
            }
        }

        return [
            'total_files' => $files->count(),
            'applied_count' => count($applied),
            'pending_count' => count($pending),
            'pending' => $pending,
            'recent_applied' => array_slice(array_reverse($applied), 0, 15),
        ];
    }

    /** @return list<array<string, mixed>> */
    public function databaseTables(int $limit = 80): array
    {
        $driver = config('database.default');

        try {
            if ($driver === 'pgsql') {
                $rows = DB::select('
                    SELECT
                        relname AS table_name,
                        n_live_tup AS approx_rows,
                        pg_total_relation_size(relid) AS size_bytes
                    FROM pg_stat_user_tables
                    ORDER BY n_live_tup DESC
                    LIMIT ?
                ', [$limit]);

                return collect($rows)->map(fn (object $row) => [
                    'name' => $row->table_name,
                    'rows' => (int) $row->approx_rows,
                    'size' => $this->formatBytes((int) $row->size_bytes),
                ])->all();
            }

            if ($driver === 'mysql') {
                $database = config('database.connections.mysql.database');
                $rows = DB::select('
                    SELECT table_name, table_rows, data_length + index_length AS size_bytes
                    FROM information_schema.tables
                    WHERE table_schema = ?
                    ORDER BY table_rows DESC
                    LIMIT ?
                ', [$database, $limit]);

                return collect($rows)->map(fn (object $row) => [
                    'name' => $row->table_name,
                    'rows' => (int) $row->table_rows,
                    'size' => $this->formatBytes((int) $row->size_bytes),
                ])->all();
            }

            if ($driver === 'sqlite') {
                $rows = DB::select("SELECT name AS table_name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name");

                return collect($rows)
                    ->take($limit)
                    ->map(function (object $row) {
                        $count = DB::table($row->table_name)->count();

                        return [
                            'name' => $row->table_name,
                            'rows' => $count,
                            'size' => '—',
                        ];
                    })
                    ->sortByDesc('rows')
                    ->values()
                    ->all();
            }
        } catch (\Throwable) {
            return [];
        }

        return [];
    }

    /** @return list<array<string, mixed>> */
    public function businessMetrics(): array
    {
        $labels = (array) config('ops-monitor.key_tables', []);
        $metrics = [];

        foreach ($labels as $table => $label) {
            if (! Schema::hasTable($table)) {
                $metrics[] = [
                    'table' => $table,
                    'label' => $label,
                    'count' => null,
                    'missing' => true,
                ];

                continue;
            }

            try {
                $metrics[] = [
                    'table' => $table,
                    'label' => $label,
                    'count' => (int) DB::table($table)->count(),
                    'missing' => false,
                ];
            } catch (\Throwable) {
                $metrics[] = [
                    'table' => $table,
                    'label' => $label,
                    'count' => null,
                    'missing' => true,
                ];
            }
        }

        return $metrics;
    }

    /** @return list<array<string, mixed>> */
    public function parsedLogIssues(int $lines = 300, int $limit = 25): array
    {
        $rawLines = $this->tailLaravelLog($lines);
        $issues = [];
        $current = null;

        foreach ($rawLines as $line) {
            if (preg_match('/^\[([^\]]+)\]\s+(\w+)\.(\w+):\s*(.*)$/', $line, $matches)) {
                if ($current !== null && in_array($current['level'], ['ERROR', 'CRITICAL', 'ALERT', 'EMERGENCY'], true)) {
                    $issues[] = $current;
                }

                $current = [
                    'timestamp' => $matches[1],
                    'channel' => $matches[2],
                    'level' => strtoupper($matches[3]),
                    'message' => $matches[4],
                    'detail' => '',
                ];

                continue;
            }

            if ($current !== null && $line !== '') {
                $current['detail'] .= ($current['detail'] === '' ? '' : "\n").$line;
            }
        }

        if ($current !== null && in_array($current['level'], ['ERROR', 'CRITICAL', 'ALERT', 'EMERGENCY'], true)) {
            $issues[] = $current;
        }

        return collect($issues)
            ->reverse()
            ->take($limit)
            ->map(function (array $issue) {
                $issue['detail'] = Str::limit($issue['detail'], 400);

                return $issue;
            })
            ->values()
            ->all();
    }

    protected function databaseSize(): ?string
    {
        $driver = config('database.default');

        try {
            if ($driver === 'pgsql') {
                $row = DB::selectOne('SELECT pg_size_pretty(pg_database_size(current_database())) AS size');

                return $row->size ?? null;
            }

            if ($driver === 'mysql') {
                $database = config('database.connections.mysql.database');
                $row = DB::selectOne('
                    SELECT ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS size_mb
                    FROM information_schema.tables
                    WHERE table_schema = ?
                ', [$database]);

                return isset($row->size_mb) ? $row->size_mb.' MB' : null;
            }
        } catch (\Throwable) {
            return null;
        }

        return null;
    }

    protected function directorySize(string $path): string
    {
        if (! File::isDirectory($path)) {
            return '0 B';
        }

        $bytes = 0;
        foreach (File::allFiles($path) as $file) {
            $bytes += $file->getSize();
        }

        return $this->formatBytes($bytes);
    }

    protected function formatBytes(int $bytes): string
    {
        if ($bytes < 1024) {
            return $bytes.' B';
        }

        if ($bytes < 1048576) {
            return round($bytes / 1024, 1).' KB';
        }

        if ($bytes < 1073741824) {
            return round($bytes / 1048576, 1).' MB';
        }

        return round($bytes / 1073741824, 2).' GB';
    }

    protected function routeHealth(?object $stat): string
    {
        if (! $stat || (int) $stat->hits === 0) {
            return 'idle';
        }

        $errorRate = ((int) $stat->errors) / max(1, (int) $stat->hits);

        if ((int) ($stat->last_status ?? 0) >= 500) {
            return 'failing';
        }

        if ($errorRate >= 0.25) {
            return 'degraded';
        }

        if ($errorRate > 0) {
            return 'warning';
        }

        return 'healthy';
    }
}
