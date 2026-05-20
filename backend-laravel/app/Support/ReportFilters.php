<?php

namespace App\Support;

use Carbon\Carbon;
use Illuminate\Http\Request;

readonly class ReportFilters
{
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

        return new self(
            tenantId: $tenantId,
            from: $from,
            to: $to,
            locationId: $request->filled('location_id') ? $request->integer('location_id') : null,
            staffMemberId: $request->filled('staff_id') ? $request->integer('staff_id') : null,
            serviceId: $request->filled('service_id') ? $request->integer('service_id') : null,
            status: $request->filled('status') ? $request->string('status')->toString() : null,
        );
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
