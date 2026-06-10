<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\ChairRentalBillingInterval;
use App\Http\Controllers\Api\V1\Concerns\ResolvesTenantFromRequest;
use App\Http\Controllers\Controller;
use App\Models\ChairRentalProfile;
use App\Models\StaffMember;
use App\Services\ChairRentalService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ChairRentalController extends Controller
{
    use ResolvesTenantFromRequest;

    public function __construct(
        private readonly ChairRentalService $rentals,
    ) {}

    public function index(Request $request, string $tenantSlug): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);
        $paginator = $this->rentals->paginate($tenant->id, $request->integer('per_page', 20));

        return response()->json([
            'data' => collect($paginator->items())->map(fn (ChairRentalProfile $profile) => $this->rentals->formatProfile($profile))->values(),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }

    public function upsert(Request $request, string $tenantSlug, StaffMember $staffMember): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);
        abort_unless($staffMember->tenant_id === $tenant->id, 404);

        $data = $request->validate([
            'rental_fee_cents' => ['required', 'integer', 'min:0'],
            'billing_interval' => ['required', Rule::in(ChairRentalBillingInterval::values())],
            'schedule' => ['nullable', 'array'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $profile = $this->rentals->upsert($tenant->id, $staffMember, $data);

        return response()->json([
            'data' => $this->rentals->formatProfile($profile),
        ]);
    }

    public function destroy(Request $request, string $tenantSlug, ChairRentalProfile $chairRentalProfile): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);
        abort_unless($chairRentalProfile->tenant_id === $tenant->id, 404);

        $this->rentals->delete($chairRentalProfile);

        return response()->json(['message' => 'Chair rental profile deleted']);
    }
}
