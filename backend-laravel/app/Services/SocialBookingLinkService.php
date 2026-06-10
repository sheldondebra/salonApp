<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\BookingAttribution;
use App\Models\SocialBookingLink;
use App\Models\Tenant;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class SocialBookingLinkService
{
    public function paginate(int $tenantId, int $perPage = 20): LengthAwarePaginator
    {
        return SocialBookingLink::query()
            ->where('tenant_id', $tenantId)
            ->latest()
            ->paginate(min($perPage, 50));
    }

    public function create(int $tenantId, array $data): SocialBookingLink
    {
        return SocialBookingLink::query()->create(array_merge($data, [
            'tenant_id' => $tenantId,
        ]));
    }

    public function update(SocialBookingLink $link, array $data): SocialBookingLink
    {
        $link->update($data);

        return $link->fresh();
    }

    public function delete(SocialBookingLink $link): void
    {
        $link->delete();
    }

    /** @return array<string, mixed> */
    public function trackClick(SocialBookingLink $link, ?Appointment $appointment = null, ?string $referrer = null): array
    {
        $link->increment('click_count');

        $attribution = null;
        if ($appointment) {
            $attribution = $this->storeAttribution(
                $appointment->tenant_id,
                $appointment,
                [
                    'source' => $link->utm_source ?: $link->platform,
                    'medium' => $link->utm_medium ?: 'social',
                    'campaign' => $link->utm_campaign,
                    'referrer' => $referrer,
                ]
            );
        }

        return [
            'target_url' => $link->url,
            'click_count' => (int) $link->fresh()->click_count,
            'attribution' => $attribution ? $this->formatAttribution($attribution) : null,
        ];
    }

    public function storeAttribution(int $tenantId, Appointment $appointment, array $data): BookingAttribution
    {
        return BookingAttribution::query()->create([
            'tenant_id' => $tenantId,
            'appointment_id' => $appointment->id,
            'source' => $data['source'] ?? null,
            'medium' => $data['medium'] ?? null,
            'campaign' => $data['campaign'] ?? null,
            'referrer' => $data['referrer'] ?? null,
        ]);
    }

    public function buildShareUrl(Tenant $tenant, SocialBookingLink $link): string
    {
        $base = url('/api/v1/'.$tenant->slug.'/social-booking-links/'.$link->id.'/track-click');

        return $base;
    }

    /** @return array<string, mixed> */
    public function formatLink(SocialBookingLink $link, ?Tenant $tenant = null): array
    {
        return [
            'id' => $link->id,
            'platform' => $link->platform,
            'url' => $link->url,
            'utm_source' => $link->utm_source,
            'utm_medium' => $link->utm_medium,
            'utm_campaign' => $link->utm_campaign,
            'click_count' => (int) $link->click_count,
            'is_active' => (bool) $link->is_active,
            'share_url' => $tenant ? $this->buildShareUrl($tenant, $link) : null,
            'created_at' => $link->created_at?->toIso8601String(),
        ];
    }

    /** @return array<string, mixed> */
    public function formatAttribution(BookingAttribution $attribution): array
    {
        return [
            'id' => $attribution->id,
            'appointment_id' => $attribution->appointment_id,
            'source' => $attribution->source,
            'medium' => $attribution->medium,
            'campaign' => $attribution->campaign,
            'referrer' => $attribution->referrer,
            'created_at' => $attribution->created_at?->toIso8601String(),
        ];
    }
}
