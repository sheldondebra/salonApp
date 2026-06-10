<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\PackageBalanceStatus;
use App\Http\Controllers\Api\V1\Concerns\ResolvesTenantFromRequest;
use App\Http\Controllers\Controller;
use App\Models\ClientPackageBalance;
use App\Models\PackageRedemption;
use App\Models\ServicePackage;
use App\Services\ServicePackageService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ServicePackageController extends Controller
{
    use ResolvesTenantFromRequest;

    public function __construct(
        private readonly ServicePackageService $packages,
    ) {}

    public function index(Request $request, string $tenantSlug): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);
        $filters = $request->validate([
            'q' => ['nullable', 'string', 'max:100'],
            'is_active' => ['nullable', 'boolean'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        $paginator = $this->packages->paginatePackages($tenant->id, $filters, (int) ($filters['per_page'] ?? 20));

        return response()->json([
            'data' => collect($paginator->items())->map(fn (ServicePackage $package) => $this->packages->formatPackage($package)),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }

    public function store(Request $request, string $tenantSlug): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'service_id' => ['nullable', 'integer', 'exists:services,id'],
            'sessions_included' => ['required', 'integer', 'min:1'],
            'price_cents' => ['required', 'integer', 'min:0'],
            'expiry_days' => ['nullable', 'integer', 'min:1'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $package = $this->packages->createPackage($tenant->id, $data);

        return response()->json(['data' => $this->packages->formatPackage($package)], 201);
    }

    public function show(Request $request, string $tenantSlug, ServicePackage $servicePackage): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);
        abort_unless($servicePackage->tenant_id === $tenant->id, 404);

        return response()->json(['data' => $this->packages->formatPackage($servicePackage)]);
    }

    public function update(Request $request, string $tenantSlug, ServicePackage $servicePackage): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);
        abort_unless($servicePackage->tenant_id === $tenant->id, 404);

        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'service_id' => ['nullable', 'integer', 'exists:services,id'],
            'sessions_included' => ['sometimes', 'integer', 'min:1'],
            'price_cents' => ['sometimes', 'integer', 'min:0'],
            'expiry_days' => ['nullable', 'integer', 'min:1'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $package = $this->packages->updatePackage($servicePackage, $data);

        return response()->json(['data' => $this->packages->formatPackage($package)]);
    }

    public function destroy(Request $request, string $tenantSlug, ServicePackage $servicePackage): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);
        abort_unless($servicePackage->tenant_id === $tenant->id, 404);

        $this->packages->deletePackage($servicePackage);

        return response()->json(['message' => 'Service package archived.']);
    }

    public function balances(Request $request, string $tenantSlug): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);
        $filters = $request->validate([
            'client_user_id' => ['nullable', 'integer', 'exists:users,id'],
            'status' => ['nullable', 'string', Rule::in(array_column(PackageBalanceStatus::cases(), 'value'))],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        $paginator = $this->packages->paginateBalances($tenant->id, $filters, (int) ($filters['per_page'] ?? 20));

        return response()->json([
            'data' => collect($paginator->items())->map(fn (ClientPackageBalance $balance) => $this->packages->formatBalance($balance)),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }

    public function sell(Request $request, string $tenantSlug): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);
        $data = $request->validate([
            'service_package_id' => ['required', 'integer', 'exists:service_packages,id'],
            'client_user_id' => ['required', 'integer', 'exists:users,id'],
            'sale_id' => ['nullable', 'integer', 'exists:sales,id'],
        ]);

        $balance = $this->packages->sell($tenant->id, $data, $request->user());

        return response()->json(['data' => $this->packages->formatBalance($balance)], 201);
    }

    public function redeem(Request $request, string $tenantSlug, ClientPackageBalance $clientPackageBalance): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);
        abort_unless($clientPackageBalance->tenant_id === $tenant->id, 404);

        $data = $request->validate([
            'sessions_used' => ['nullable', 'integer', 'min:1'],
            'appointment_id' => ['nullable', 'integer', 'exists:appointments,id'],
            'sale_id' => ['nullable', 'integer', 'exists:sales,id'],
            'note' => ['nullable', 'string', 'max:1000'],
        ]);

        $balance = $this->packages->redeem($clientPackageBalance, $data, $request->user());

        return response()->json(['data' => $this->packages->formatBalance($balance)]);
    }

    public function ledger(Request $request, string $tenantSlug): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);
        $filters = $request->validate([
            'client_package_balance_id' => ['nullable', 'integer', 'exists:client_package_balances,id'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        $paginator = $this->packages->ledger($tenant->id, $filters, (int) ($filters['per_page'] ?? 20));

        return response()->json([
            'data' => collect($paginator->items())->map(fn (PackageRedemption $redemption) => $this->packages->formatRedemption($redemption)),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }

    public function redeemLegacy(Request $request, string $tenantSlug): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);
        $data = $request->validate([
            'client_package_id' => ['required', 'integer', 'exists:client_package_balances,id'],
            'quantity' => ['nullable', 'integer', 'min:1'],
            'service_id' => ['nullable', 'integer', 'exists:services,id'],
            'appointment_id' => ['nullable', 'integer', 'exists:appointments,id'],
            'note' => ['nullable', 'string', 'max:1000'],
        ]);

        $balance = ClientPackageBalance::query()
            ->where('tenant_id', $tenant->id)
            ->findOrFail($data['client_package_id']);

        $balance = $this->packages->redeem($balance, [
            'sessions_used' => (int) ($data['quantity'] ?? 1),
            'appointment_id' => $data['appointment_id'] ?? null,
            'note' => $data['note'] ?? null,
        ], $request->user());

        return response()->json(['data' => $this->packages->formatBalance($balance)]);
    }
}
