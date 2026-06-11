<?php

namespace App\Services;

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Str;

class OpsApiDocumentationService
{
    public const BASE_PATH = '/api/v1';

    /** @return list<array{key: string, label: string, count: int}> */
    public function sections(): array
    {
        $counts = [];
        foreach ($this->allEndpoints() as $endpoint) {
            $counts[$endpoint['section_key']] = ($counts[$endpoint['section_key']] ?? 0) + 1;
        }

        $sections = [];
        foreach ($counts as $key => $count) {
            $sections[] = [
                'key' => $key,
                'label' => $this->sectionLabel($key),
                'count' => $count,
            ];
        }

        usort($sections, fn (array $a, array $b) => $a['label'] <=> $b['label']);

        return $sections;
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function endpoints(?string $section = null, ?string $search = null): array
    {
        $items = $this->allEndpoints();

        if ($section !== null && $section !== '') {
            $items = array_values(array_filter($items, fn (array $e) => $e['section_key'] === $section));
        }

        if ($search !== null && trim($search) !== '') {
            $needle = Str::lower(trim($search));
            $items = array_values(array_filter($items, function (array $e) use ($needle) {
                return str_contains(Str::lower($e['path']), $needle)
                    || str_contains(Str::lower($e['handler']), $needle)
                    || str_contains(Str::lower(implode(',', $e['methods'])), $needle)
                    || str_contains(Str::lower($e['auth']), $needle)
                    || str_contains(Str::lower($e['permission']), $needle);
            }));
        }

        usort($items, fn (array $a, array $b) => [$a['path'], $a['methods'][0] ?? ''] <=> [$b['path'], $b['methods'][0] ?? '']);

        return $items;
    }

    public function totalCount(): int
    {
        return count($this->allEndpoints());
    }

    public function toMarkdown(): string
    {
        $lines = [
            '# Schedelux API Reference',
            '',
            'Base URL: `'.rtrim((string) config('app.url'), '/').self::BASE_PATH.'`',
            '',
            '## Authentication',
            '',
            '- **Web:** session cookie via `POST /auth/login`',
            '- **Mobile:** `Authorization: Bearer {token}` via `POST /auth/token`',
            '- **Tenant workspace:** Bearer + `/{tenantSlug}/…` path',
            '- **Public booking:** no auth — custom domain `/booking/*` or `/{tenantSlug}/book/*`',
            '',
        ];

        foreach ($this->sections() as $section) {
            $lines[] = '## '.$section['label'];
            $lines[] = '';
            $lines[] = '| Method | Path | Auth | Permission | Handler |';
            $lines[] = '|--------|------|------|------------|---------|';

            foreach ($this->endpoints($section['key']) as $endpoint) {
                $lines[] = sprintf(
                    '| %s | `%s` | %s | %s | `%s` |',
                    implode(', ', $endpoint['methods']),
                    $endpoint['path'],
                    $endpoint['auth'],
                    $endpoint['permission'] ?: '—',
                    $endpoint['handler']
                );
            }

            $lines[] = '';
        }

        return implode("\n", $lines);
    }

    /** @return list<array<string, mixed>> */
    protected function allEndpoints(): array
    {
        static $cache = null;
        if ($cache !== null) {
            return $cache;
        }

        $endpoints = [];

        foreach (Route::getRoutes() as $route) {
            $uri = $route->uri();
            if (! str_starts_with($uri, 'api/')) {
                continue;
            }

            $path = '/'.ltrim(preg_replace('#^api/v1/?#', '', $uri), '/');
            $methods = array_values(array_diff($route->methods(), ['HEAD']));
            $middleware = $route->gatherMiddleware();
            $sectionKey = $this->sectionKey($path);

            $endpoints[] = [
                'section_key' => $sectionKey,
                'section_label' => $this->sectionLabel($sectionKey),
                'path' => $path,
                'methods' => $methods,
                'auth' => $this->authLabel($middleware),
                'permission' => $this->permissionLabel($middleware),
                'handler' => $this->handlerLabel((string) $route->getActionName()),
                'middleware' => $middleware,
            ];
        }

        $cache = $endpoints;

        return $cache;
    }

    protected function sectionKey(string $path): string
    {
        $trimmed = trim($path, '/');
        $parts = explode('/', $trimmed);

        if (($parts[0] ?? '') === '{tenantSlug}') {
            return 'tenant/'.($parts[1] ?? 'root');
        }

        return $parts[0] ?: 'root';
    }

    protected function sectionLabel(string $key): string
    {
        if (str_starts_with($key, 'tenant/')) {
            return 'Tenant › '.Str::headline(str_replace('/', ' ', substr($key, 7)));
        }

        return Str::headline(str_replace('/', ' ', $key));
    }

    /** @param list<string> $middleware */
    protected function authLabel(array $middleware): string
    {
        $joined = implode(' ', $middleware);
        $hasAuth = str_contains($joined, 'Authenticate:sanctum') || str_contains($joined, 'auth:sanctum');

        if ($hasAuth) {
            if (str_contains($joined, 'EnsureTenantAccess')) {
                return 'Bearer + Tenant';
            }

            return 'Bearer';
        }

        if (str_contains($joined, 'ResolveTenant')) {
            return 'Public (tenant)';
        }

        return 'Public';
    }

    /** @param list<string> $middleware */
    protected function permissionLabel(array $middleware): string
    {
        foreach ($middleware as $mw) {
            if (str_contains($mw, 'EnsurePermission') && preg_match("/EnsurePermission:([^']+)/", $mw, $match)) {
                return str_replace('\\', '', $match[1]);
            }
        }

        return '';
    }

    protected function handlerLabel(string $action): string
    {
        if (! str_contains($action, '@')) {
            return class_basename($action);
        }

        [$class, $method] = explode('@', $action, 2);
        $short = preg_replace('#^App\\\\Http\\\\Controllers\\\\Api\\\\V1\\\\#', '', $class);
        $short = preg_replace('#^Admin\\\\#', 'Admin/', (string) $short);

        return $short.'@'.$method;
    }
}
