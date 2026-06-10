<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\V1\Concerns\ResolvesTenantFromRequest;
use App\Http\Controllers\Controller;
use App\Models\Supplier;
use App\Models\SupplierContact;
use App\Services\SupplierContactService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SupplierContactController extends Controller
{
    use ResolvesTenantFromRequest;

    public function __construct(
        private readonly SupplierContactService $contacts,
    ) {}

    public function index(Request $request, string $tenantSlug, Supplier $supplier): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);
        abort_unless($supplier->tenant_id === $tenant->id, 404);

        $paginator = $this->contacts->paginateForSupplier($supplier, (int) $request->integer('per_page', 20));

        return response()->json([
            'data' => collect($paginator->items())->map(fn (SupplierContact $contact) => $this->contacts->format($contact)),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }

    public function store(Request $request, string $tenantSlug, Supplier $supplier): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);
        abort_unless($supplier->tenant_id === $tenant->id, 404);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'role' => ['nullable', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'notes' => ['nullable', 'string', 'max:5000'],
        ]);

        $contact = $this->contacts->create($supplier, $data);

        return response()->json(['data' => $this->contacts->format($contact)], 201);
    }

    public function update(Request $request, string $tenantSlug, Supplier $supplier, SupplierContact $supplierContact): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);
        abort_unless($supplier->tenant_id === $tenant->id && $supplierContact->supplier_id === $supplier->id, 404);

        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'role' => ['nullable', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'notes' => ['nullable', 'string', 'max:5000'],
        ]);

        $contact = $this->contacts->update($supplierContact, $data);

        return response()->json(['data' => $this->contacts->format($contact)]);
    }

    public function destroy(Request $request, string $tenantSlug, Supplier $supplier, SupplierContact $supplierContact): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);
        abort_unless($supplier->tenant_id === $tenant->id && $supplierContact->supplier_id === $supplier->id, 404);

        $this->contacts->delete($supplierContact);

        return response()->json(['message' => 'Supplier contact deleted.']);
    }
}
