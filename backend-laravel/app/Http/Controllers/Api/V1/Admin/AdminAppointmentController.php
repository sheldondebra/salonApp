<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\AppointmentResource;
use App\Models\Appointment;
use App\Models\Tenant;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AdminAppointmentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Tenant::class);

        $filter = $request->string('filter', 'upcoming')->toString();
        $today = Carbon::today();

        $query = Appointment::query()
            ->withoutGlobalScope('tenant')
            ->with(['service', 'staffMember', 'client', 'location', 'tenant']);

        if ($request->filled('tenant_id')) {
            $query->where('tenant_id', $request->integer('tenant_id'));
        }

        match ($filter) {
            'today' => $query->whereDate('starts_at', $today),
            'upcoming' => $query
                ->where('starts_at', '>=', now())
                ->whereNotIn('status', ['cancelled', 'no_show']),
            'past' => $query->where('ends_at', '<', now()),
            'all' => null,
            default => null,
        };

        if ($request->filled('status')) {
            $query->where('status', $request->string('status')->toString());
        }

        if ($request->filled('q')) {
            $term = '%'.$request->string('q')->trim()->toString().'%';
            $query->where(function ($q) use ($term) {
                $q->whereHas('client', function ($c) use ($term) {
                    $c->where('name', 'like', $term)->orWhere('email', 'like', $term);
                })
                    ->orWhereHas('service', function ($s) use ($term) {
                        $s->where('name', 'like', $term);
                    })
                    ->orWhereHas('staffMember', function ($s) use ($term) {
                        $s->where('display_name', 'like', $term);
                    })
                    ->orWhereHas('tenant', function ($t) use ($term) {
                        $t->where('name', 'like', $term)->orWhere('slug', 'like', $term);
                    });
            });
        }

        $ascending = in_array($filter, ['today', 'upcoming'], true);
        $appointments = $query
            ->orderBy('starts_at', $ascending ? 'asc' : 'desc')
            ->paginate(min($request->integer('per_page', 30), 100));

        $base = Appointment::query()->withoutGlobalScope('tenant');

        return response()->json([
            'data' => AppointmentResource::collection($appointments),
            'meta' => [
                'current_page' => $appointments->currentPage(),
                'last_page' => $appointments->lastPage(),
                'total' => $appointments->total(),
                'filter' => $filter,
                'summary' => [
                    'today' => (clone $base)->whereDate('starts_at', $today)->count(),
                    'upcoming' => (clone $base)
                        ->where('starts_at', '>=', now())
                        ->whereNotIn('status', ['cancelled', 'no_show', 'completed'])
                        ->count(),
                    'all' => (clone $base)->count(),
                ],
            ],
        ]);
    }

    public function show(string $uuid): JsonResponse
    {
        $this->authorize('viewAny', Tenant::class);

        $appointment = Appointment::query()
            ->withoutGlobalScope('tenant')
            ->where('uuid', $uuid)
            ->with(['service', 'staffMember', 'client', 'location', 'tenant'])
            ->firstOrFail();

        return response()->json([
            'data' => new AppointmentResource($appointment),
        ]);
    }

    public function update(Request $request, string $uuid): JsonResponse
    {
        $this->authorize('viewAny', Tenant::class);

        $appointment = Appointment::query()
            ->withoutGlobalScope('tenant')
            ->where('uuid', $uuid)
            ->firstOrFail();

        $validated = $request->validate([
            'status' => ['sometimes', 'string', Rule::in([
                'pending', 'confirmed', 'completed', 'cancelled', 'no_show',
            ])],
            'notes' => ['sometimes', 'nullable', 'string', 'max:5000'],
        ]);

        $appointment->fill($validated);
        $appointment->save();

        $appointment->load(['service', 'staffMember', 'client', 'location', 'tenant']);

        return response()->json([
            'data' => new AppointmentResource($appointment),
        ]);
    }
}
