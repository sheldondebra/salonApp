<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;

class TenantSmsUsage extends Model
{
    use BelongsToTenant;

    /** Migration table name is singular (`tenant_sms_usage`). */
    protected $table = 'tenant_sms_usage';

    protected $fillable = [
        'tenant_id',
        'period',
        'sent_count',
        'failed_count',
    ];

    public static function currentPeriod(): string
    {
        return now()->format('Y-m');
    }
}
