<?php

namespace App\Support;

use App\Models\Location;
use App\Models\Service;
use App\Models\StaffMember;
use Carbon\Carbon;
use Illuminate\Http\Request;

readonly class ReportFilters
{
    private const STATUSES = ['pending', 'confirmed', 'completed', 'cancelled', 'no_show'];

    private const MAX_RANGE_DAYS = 366;
    public function __construct(
        public ?int $tenantId,
        public Carbon $from,
        public Carbon $to,
        public ?int $locationId = null,
        public ?int $staffMemberId = null,
        public ?int $serviceId = null,
        public ?string $status = null,
    ) {}

    public static function fromRequest(Request $request, ?int $tenantId = null): self
    {
        $from = $request->filled('from')
            ? Carbon::parse($request->string('from')->toString())->startOfDay()
            : Carbon::now()->subDays(29)->startOfDay();

        $to = $request->filled('to')
            ? Carbon::parse($request->string('to')->toString())->endOfDay()
            : Carbon::now()->endOfDay();

        if ($from->gt($to)) {
            [$from, $to] = [$to->copy()->startOfDay(), $from->copy()->endOfDay()];
        }

        if ($from->diffInDays($to) > self::MAX_RANGE_DAYS) {
            $from = $to->copy()->subDays(self::MAX_RANGE_DAYS)->startOfDay();
        }

        $locationId = $request->filled('location_id') ? $request->integer('location_id') : null;
        $staffMemberId = $request->filled('staff_id') ? $request->integer('staff_id') : null;
        $serviceId = $request->filled('service_id') ? $request->integer('service_id') : null;
        $status = $request->filled('status') ? $request->string('status')->toString() : null;

        if ($tenantId) {
            $locationId = self::scopedId($tenantId, $locationId, Location::class);
            $staffMemberId = self::scopedId($tenantId, $staffMemberId, StaffMember::class);
            $serviceId = self::scopedId($tenantId, $serviceId, Service::class);
        }

        if ($status && ! in_array($status, self::STATUSES, true)) {
            $status = null;
        }

        return new self(
            tenantId: $tenantId,
            from: $from,
            to: $to,
            locationId: $locationId,
            staffMemberId: $staffMemberId,
            serviceId: $serviceId,
            status: $status,
        );
    }

    /**
     * @param  class-string<\Illuminate\Database\Eloquent\Model>  $model
     */
    protected static function scopedId(int $tenantId, ?int $id, string $model): ?int
    {
        if (! $id) {
            return null;
        }

        $exists = $model::query()
            ->withoutGlobalScope('tenant')
            ->where('tenant_id', $tenantId)
            ->whereKey($id)
            ->exists();

        return $exists ? $id : null;
    }

    /** @return array{from: string, to: string, location_id: ?int, staff_id: ?int, service_id: ?int, status: ?string} */
    public function toArray(): array
    {
        return [
            'from' => $this->from->toDateString(),
            'to' => $this->to->toDateString(),
            'location_id' => $this->locationId,
            'staff_id' => $this->staffMemberId,
            'service_id' => $this->serviceId,
            'status' => $this->status,
        ];
    }
}
