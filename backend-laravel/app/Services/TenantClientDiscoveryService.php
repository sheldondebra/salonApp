<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\ClientFavorite;
use App\Models\Service;
use App\Models\StaffMember;
use App\Models\User;

class TenantClientDiscoveryService
{
    /** @return array<string, mixed> */
    public function feed(int $tenantId, User $user): array
    {
        $favoriteIds = ClientFavorite::query()
            ->where('tenant_id', $tenantId)
            ->where('user_id', $user->id)
            ->get()
            ->groupBy('favoritable_type')
            ->map(fn ($rows) => $rows->pluck('favoritable_id')->all());

        $favoriteServiceIds = collect($favoriteIds[Service::class] ?? []);
        $favoriteStaffIds = collect($favoriteIds[StaffMember::class] ?? []);

        $services = Service::query()
            ->where('tenant_id', $tenantId)
            ->whereBool('is_active', true)
            ->orderByDesc('updated_at')
            ->limit(12)
            ->get();

        $staff = StaffMember::query()
            ->where('tenant_id', $tenantId)
            ->whereBool('is_active', true)
            ->whereBool('is_bookable', true)
            ->orderByDesc('updated_at')
            ->limit(8)
            ->get();

        $recentAppointments = Appointment::query()
            ->withoutGlobalScope('tenant')
            ->where('tenant_id', $tenantId)
            ->where('client_user_id', $user->id)
            ->where('status', 'completed')
            ->with(['service:id,name,price_cents,duration_minutes', 'staffMember:id,display_name'])
            ->latest('starts_at')
            ->limit(6)
            ->get();

        return [
            'favorites_count' => $favoriteServiceIds->count() + $favoriteStaffIds->count(),
            'recommended' => $services->take(6)->map(fn (Service $service) => $this->formatServiceItem($service, $favoriteServiceIds->contains($service->id)))->values()->all(),
            'trending' => $services->sortByDesc('price_cents')->take(6)->map(fn (Service $service) => $this->formatServiceItem($service, $favoriteServiceIds->contains($service->id)))->values()->all(),
            'recently_booked' => $recentAppointments->map(function (Appointment $appointment) use ($favoriteServiceIds, $favoriteStaffIds) {
                if ($appointment->service) {
                    return $this->formatServiceItem($appointment->service, $favoriteServiceIds->contains($appointment->service_id));
                }
                if ($appointment->staffMember) {
                    return $this->formatStaffItem($appointment->staffMember, $favoriteStaffIds->contains($appointment->staff_member_id));
                }

                return null;
            })->filter()->values()->all(),
        ];
    }

    /** @return array<string, mixed> */
    private function formatServiceItem(Service $service, bool $isFavorite): array
    {
        return [
            'id' => $service->id,
            'type' => 'service',
            'name' => $service->name,
            'subtitle' => 'Service',
            'description' => $service->description,
            'image_url' => $service->image_url,
            'price_cents' => (int) $service->price_cents,
            'duration_minutes' => (int) $service->duration_minutes,
            'rating' => null,
            'is_favorite' => $isFavorite,
            'href' => '/book?service='.$service->uuid,
        ];
    }

    /** @return array<string, mixed> */
    private function formatStaffItem(StaffMember $staff, bool $isFavorite): array
    {
        return [
            'id' => $staff->id,
            'type' => 'staff',
            'name' => $staff->display_name,
            'subtitle' => $staff->title,
            'description' => null,
            'image_url' => $staff->avatar_url,
            'rating' => null,
            'is_favorite' => $isFavorite,
            'href' => '/book?staff='.$staff->uuid,
        ];
    }
}
