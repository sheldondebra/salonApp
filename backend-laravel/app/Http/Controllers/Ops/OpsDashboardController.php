<?php

namespace App\Http\Controllers\Ops;

use App\Http\Controllers\Controller;
use App\Services\OpsMonitorService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

class OpsDashboardController extends Controller
{
    public function __construct(
        private readonly OpsMonitorService $monitor,
    ) {}

    public function index(): View
    {
        $migrations = $this->monitor->migrationStatus();
        $queue = $this->monitor->queueStatus();

        return view('ops.dashboard', [
            'stats' => $this->monitor->overviewStats(),
            'system' => $this->monitor->systemInfo(),
            'metrics' => $this->monitor->businessMetrics(),
            'migrations' => $migrations,
            'queue' => $queue,
            'operationsChecks' => $this->monitor->operationsChecklist(),
            'usageCharts' => $this->monitor->usageCharts(),
            'apiEndpointCount' => app(\App\Services\OpsApiDocumentationService::class)->totalCount(),
            'recentErrors' => $this->monitor->recentErrors(12),
            'logIssues' => $this->monitor->parsedLogIssues(400, 8),
            'failingRoutes' => collect($this->monitor->routeCatalog())
                ->filter(fn (array $route) => in_array($route['health'], ['failing', 'degraded'], true))
                ->take(10)
                ->values()
                ->all(),
        ]);
    }

    public function system(): View
    {
        return view('ops.system', [
            'system' => $this->monitor->systemInfo(),
            'queue' => $this->monitor->queueStatus(),
            'migrations' => $this->monitor->migrationStatus(),
            'operationsChecks' => $this->monitor->operationsChecklist(),
            'scheduledTasks' => $this->monitor->scheduledTasks(),
            'logIssues' => $this->monitor->parsedLogIssues(500, 30),
        ]);
    }

    public function routes(): View
    {
        return view('ops.routes', [
            'routes' => $this->monitor->routeCatalog(),
        ]);
    }

    public function routeDetail(string $routeName): View
    {
        $route = $this->monitor->routeDetail(rawurldecode($routeName));

        abort_if($route === null, 404);

        return view('ops.route-detail', ['route' => $route]);
    }

    public function requests(): View
    {
        return view('ops.requests', [
            'requests' => $this->monitor->paginateRequests(request()->only(['status', 'route', 'q'])),
            'filters' => request()->only(['status', 'route', 'q']),
        ]);
    }

    public function errors(): View
    {
        $filters = request()->only(['route', 'q', 'channel', 'per_page', 'status']);

        return view('ops.errors', [
            'summary' => $this->monitor->errorSummary(),
            'groupedErrors' => $this->monitor->groupedErrors(100),
            'channelStats' => $this->monitor->clientChannelStats(30),
            'connectivity' => $this->monitor->connectivityCheck(request()->query('watch_since')),
            'requests' => $this->monitor->paginateRequests(['status' => 'errors', ...$filters]),
            'filters' => $filters,
            'watchSince' => request()->query('watch_since', now()->toIso8601String()),
        ]);
    }

    public function errorsCheck(Request $request): JsonResponse
    {
        return response()->json(
            $this->monitor->connectivityCheck($request->query('watch_since'))
        );
    }

    public function logs(): View
    {
        return view('ops.logs', [
            'lines' => $this->monitor->tailLaravelLog(250),
        ]);
    }
}
