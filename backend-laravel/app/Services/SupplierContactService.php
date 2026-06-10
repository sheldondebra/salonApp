<?php

namespace App\Services;

use App\Models\Supplier;
use App\Models\SupplierContact;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class SupplierContactService
{
    public function paginateForSupplier(Supplier $supplier, int $perPage = 20): LengthAwarePaginator
    {
        return SupplierContact::query()
            ->where('tenant_id', $supplier->tenant_id)
            ->where('supplier_id', $supplier->id)
            ->orderBy('name')
            ->paginate(min($perPage, 50));
    }

    public function create(Supplier $supplier, array $data): SupplierContact
    {
        return SupplierContact::query()->create([
            'tenant_id' => $supplier->tenant_id,
            'supplier_id' => $supplier->id,
            'name' => $data['name'],
            'role' => $data['role'] ?? null,
            'email' => $data['email'] ?? null,
            'phone' => $data['phone'] ?? null,
            'notes' => $data['notes'] ?? null,
        ]);
    }

    public function update(SupplierContact $contact, array $data): SupplierContact
    {
        $contact->update($data);

        return $contact->fresh();
    }

    public function delete(SupplierContact $contact): void
    {
        $contact->delete();
    }

    public function format(SupplierContact $contact): array
    {
        return [
            'uuid' => $contact->uuid,
            'name' => $contact->name,
            'role' => $contact->role,
            'email' => $contact->email,
            'phone' => $contact->phone,
            'notes' => $contact->notes,
        ];
    }
}
