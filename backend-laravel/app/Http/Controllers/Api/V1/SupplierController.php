<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\SupplierResource;
use App\Models\Supplier;
use App\Support\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SupplierController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Supplier::class);

        $query = Supplier::query()->orderBy('name');

        if ($request->filled('is_active')) {
            $query->whereBool('is_active', $request->boolean('is_active'));
        }

        if ($search = $request->string('q')->trim()->toString()) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('contact_name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $paginated = $query->paginate(min($request->integer('per_page', 20), 50));

        return SupplierResource::collection($paginated)->response();
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorize('create', Supplier::class);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'contact_name' => ['nullable', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:30'],
            'notes' => ['nullable', 'string', 'max:5000'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $supplier = Supplier::query()->create($validated);

        return (new SupplierResource($supplier))
            ->response()
            ->setStatusCode(201);
    }

    public function update(Request $request, Supplier $supplier): JsonResponse
    {
        $this->ensureTenant($supplier);
        $this->authorize('update', $supplier);

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'contact_name' => ['nullable', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:30'],
            'notes' => ['nullable', 'string', 'max:5000'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $supplier->update($validated);

        return (new SupplierResource($supplier->fresh()))->response();
    }

    public function destroy(Supplier $supplier): JsonResponse
    {
        $this->ensureTenant($supplier);
        $this->authorize('delete', $supplier);

        $supplier->update(['is_active' => false]);

        return response()->json(['message' => 'Supplier deactivated.']);
    }

    protected function ensureTenant(Supplier $supplier): void
    {
        if ($supplier->tenant_id !== TenantContext::id()) {
            abort(404);
        }
    }
}
