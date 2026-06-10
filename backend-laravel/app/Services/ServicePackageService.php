<?php

namespace App\Services;

use App\Enums\PackageBalanceStatus;
use App\Models\ClientPackageBalance;
use App\Models\PackageRedemption;
use App\Models\ServicePackage;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ServicePackageService
{
    public function paginatePackages(int $tenantId, array $filters = [], int $perPage = 20): LengthAwarePaginator
    {
        $query = ServicePackage::query()
            ->where('tenant_id', $tenantId)
            ->with('service:id,uuid,name')
            ->latest();

        if (isset($filters['is_active'])) {
            $query->whereBool('is_active', (bool) $filters['is_active']);
        }

        if (! empty($filters['q'])) {
            $term = '%'.$filters['q'].'%';
            $query->where(fn ($q) => $q->where('name', 'like', $term)->orWhere('description', 'like', $term));
        }

        return $query->paginate(min($perPage, 50));
    }

    public function paginateBalances(int $tenantId, array $filters = [], int $perPage = 20): LengthAwarePaginator
    {
        $query = ClientPackageBalance::query()
            ->where('tenant_id', $tenantId)
            ->with(['package.service:id,uuid,name', 'client:id,name,email', 'sale:id,uuid,sale_number,total_cents'])
            ->latest();

        if (! empty($filters['client_user_id'])) {
            $query->where('client_user_id', (int) $filters['client_user_id']);
        }

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        return $query->paginate(min($perPage, 50));
    }

    public function ledger(int $tenantId, array $filters = [], int $perPage = 20): LengthAwarePaginator
    {
        $query = PackageRedemption::query()
            ->where('tenant_id', $tenantId)
            ->with(['balance.package:id,uuid,name', 'appointment:id,uuid,starts_at', 'sale:id,uuid,sale_number', 'redeemedBy:id,name'])
            ->latest();

        if (! empty($filters['client_package_balance_id'])) {
            $query->where('client_package_balance_id', (int) $filters['client_package_balance_id']);
        }

        return $query->paginate(min($perPage, 50));
    }

    public function createPackage(int $tenantId, array $data): ServicePackage
    {
        return ServicePackage::query()->create($this->packagePayload($tenantId, $data));
    }

    public function updatePackage(ServicePackage $package, array $data): ServicePackage
    {
        $package->update($this->packagePayload($package->tenant_id, $data, false));

        return $package->fresh('service');
    }

    public function deletePackage(ServicePackage $package): void
    {
        $package->update(['is_active' => false]);
    }

    public function sell(int $tenantId, array $data, ?User $actor = null): ClientPackageBalance
    {
        $package = ServicePackage::query()->where('tenant_id', $tenantId)->findOrFail($data['service_package_id']);
        $expiresAt = $package->expiry_days ? now()->addDays((int) $package->expiry_days) : null;

        return ClientPackageBalance::query()->create([
            'tenant_id' => $tenantId,
            'service_package_id' => $package->id,
            'client_user_id' => $data['client_user_id'],
            'sessions_total' => (int) $package->sessions_included,
            'sessions_remaining' => (int) $package->sessions_included,
            'expires_at' => $expiresAt,
            'status' => PackageBalanceStatus::Active,
            'sold_by_user_id' => $actor?->id,
            'sale_id' => $data['sale_id'] ?? null,
        ])->fresh(['package.service', 'client', 'sale']);
    }

    public function redeem(ClientPackageBalance $balance, array $data, ?User $actor = null): ClientPackageBalance
    {
        $sessionsUsed = max(1, (int) ($data['sessions_used'] ?? 1));

        if ($balance->status !== PackageBalanceStatus::Active) {
            throw ValidationException::withMessages(['balance' => ['Only active package balances can be redeemed.']]);
        }

        if ($balance->expires_at && $balance->expires_at->isPast()) {
            $balance->update(['status' => PackageBalanceStatus::Expired]);
            throw ValidationException::withMessages(['balance' => ['This package balance has expired.']]);
        }

        if ($balance->sessions_remaining < $sessionsUsed) {
            throw ValidationException::withMessages(['sessions_used' => ['Insufficient sessions remaining.']]);
        }

        DB::transaction(function () use ($balance, $data, $sessionsUsed, $actor) {
            PackageRedemption::query()->create([
                'tenant_id' => $balance->tenant_id,
                'client_package_balance_id' => $balance->id,
                'appointment_id' => $data['appointment_id'] ?? null,
                'sale_id' => $data['sale_id'] ?? null,
                'sessions_used' => $sessionsUsed,
                'note' => $data['note'] ?? null,
                'redeemed_by_user_id' => $actor?->id,
            ]);

            $remaining = max(0, $balance->sessions_remaining - $sessionsUsed);
            $balance->update([
                'sessions_remaining' => $remaining,
                'status' => $remaining > 0 ? PackageBalanceStatus::Active : PackageBalanceStatus::Exhausted,
            ]);
        });

        return $balance->fresh(['package.service', 'client', 'redemptions']);
    }

    public function formatPackage(ServicePackage $package): array
    {
        $package->loadMissing('service:id,uuid,name');

        return [
            'uuid' => $package->uuid,
            'name' => $package->name,
            'description' => $package->description,
            'sessions_included' => (int) $package->sessions_included,
            'price_cents' => (int) $package->price_cents,
            'expiry_days' => $package->expiry_days,
            'is_active' => (bool) $package->is_active,
            'service' => $package->service ? [
                'id' => $package->service->id,
                'uuid' => $package->service->uuid,
                'name' => $package->service->name,
            ] : null,
        ];
    }

    public function formatBalance(ClientPackageBalance $balance): array
    {
        $balance->loadMissing(['package.service:id,uuid,name', 'client:id,name,email']);

        return [
            'uuid' => $balance->uuid,
            'status' => $balance->status?->value ?? $balance->status,
            'sessions_total' => (int) $balance->sessions_total,
            'sessions_remaining' => (int) $balance->sessions_remaining,
            'expires_at' => $balance->expires_at?->toIso8601String(),
            'package' => $balance->package ? $this->formatPackage($balance->package) : null,
            'client' => $balance->client ? [
                'id' => $balance->client->id,
                'name' => $balance->client->name,
                'email' => $balance->client->email,
            ] : null,
        ];
    }

    public function formatRedemption(PackageRedemption $redemption): array
    {
        $redemption->loadMissing(['balance.package:id,uuid,name', 'appointment:id,uuid,starts_at', 'sale:id,uuid,sale_number', 'redeemedBy:id,name']);

        return [
            'uuid' => $redemption->uuid,
            'sessions_used' => (int) $redemption->sessions_used,
            'note' => $redemption->note,
            'created_at' => $redemption->created_at?->toIso8601String(),
            'balance_uuid' => $redemption->balance?->uuid,
            'package_name' => $redemption->balance?->package?->name,
            'appointment_uuid' => $redemption->appointment?->uuid,
            'sale_uuid' => $redemption->sale?->uuid,
            'redeemed_by' => $redemption->redeemedBy?->name,
        ];
    }

    private function packagePayload(int $tenantId, array $data, bool $creating = true): array
    {
        $payload = [];
        foreach (['name', 'description', 'service_id', 'sessions_included', 'price_cents', 'expiry_days', 'is_active'] as $key) {
            if ($creating || array_key_exists($key, $data)) {
                $payload[$key] = $data[$key] ?? null;
            }
        }

        if ($creating) {
            $payload['tenant_id'] = $tenantId;
        }

        return $payload;
    }
}
