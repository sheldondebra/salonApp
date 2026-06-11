<?php

namespace App\Console\Commands;

use App\Services\OpsMonitorService;
use Illuminate\Console\Command;

class PruneOpsLogsCommand extends Command
{
    protected $signature = 'ops:prune-logs';

    protected $description = 'Delete ops monitor request logs older than the retention period';

    public function handle(OpsMonitorService $monitor): int
    {
        $deleted = $monitor->pruneOldLogs();
        $this->info("Pruned {$deleted} ops request log(s).");

        return self::SUCCESS;
    }
}
