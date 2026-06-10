<?php

namespace App\Services;

use App\Enums\AbandonedBookingStatus;
use App\Models\AbandonedBookingSession;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class AbandonedBookingService
{
    public function paginate(int $tenantId, array $filters = [], int $perPage = 20): LengthAwarePaginator
    {
        $query = AbandonedBookingSession::query()
            ->where('tenant_id', $tenantId)
            ->latest('last_activity_at')
            ->latest();

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (! empty($filters['source'])) {
            $query->where('source', $filters['source']);
        }

        if (! empty($filters['q'])) {
            $term = '%'.$filters['q'].'%';
            $query->where(function ($inner) use ($term) {
                $inner->where('client_name', 'like', $term)
                    ->orWhere('client_email', 'like', $term)
                    ->orWhere('client_phone', 'like', $term);
            });
        }

        return $query->paginate(min($perPage, 50));
    }

    public function create(int $tenantId, array $data): AbandonedBookingSession
    {
        return AbandonedBookingSession::query()->create([
            'tenant_id' => $tenantId,
            'client_email' => $data['client_email'] ?? null,
            'client_phone' => $data['client_phone'] ?? null,
            'client_name' => $data['client_name'] ?? null,
            'draft' => $data['draft'] ?? [],
            'status' => $data['status'] ?? AbandonedBookingStatus::Abandoned->value,
            'last_activity_at' => $data['last_activity_at'] ?? now(),
            'source' => $data['source'] ?? null,
        ])->fresh();
    }

    public function update(AbandonedBookingSession $session, array $data): AbandonedBookingSession
    {
        $status = $data['status'] ?? ($session->status?->value ?? $session->status);

        $session->update(array_filter([
            'client_email' => $data['client_email'] ?? $session->client_email,
            'client_phone' => array_key_exists('client_phone', $data) ? $data['client_phone'] : $session->client_phone,
            'client_name' => array_key_exists('client_name', $data) ? $data['client_name'] : $session->client_name,
            'draft' => array_key_exists('draft', $data) ? $data['draft'] : $session->draft,
            'status' => $status,
            'last_activity_at' => $data['last_activity_at'] ?? $session->last_activity_at,
            'recovered_appointment_id' => $data['recovered_appointment_id'] ?? $session->recovered_appointment_id,
            'recovered_at' => $status === AbandonedBookingStatus::Recovered->value ? now() : $session->recovered_at,
            'source' => array_key_exists('source', $data) ? $data['source'] : $session->source,
        ], fn ($value) => $value !== null));

        return $session->fresh(['recoveredAppointment']);
    }

    public function delete(AbandonedBookingSession $session): void
    {
        $session->delete();
    }

    /** @return array<string, mixed> */
    public function sendReminderPlaceholder(AbandonedBookingSession $session): array
    {
        $session->increment('reminder_count');
        $session->update(['last_reminder_at' => now()]);

        return [
            'queued' => true,
            'channel' => 'placeholder',
            'message' => 'Reminder placeholder queued.',
        ];
    }

    /** @return array<string, mixed> */
    public function analytics(int $tenantId): array
    {
        $base = AbandonedBookingSession::query()->where('tenant_id', $tenantId);
        $total = (clone $base)->count();
        $recovered = (clone $base)->where('status', AbandonedBookingStatus::Recovered)->count();

        return [
            'total_sessions' => $total,
            'recovered_sessions' => $recovered,
            'recovery_rate_percent' => $total > 0 ? round(($recovered / $total) * 100, 1) : 0,
            'reminders_sent' => (int) (clone $base)->sum('reminder_count'),
            'sources' => (clone $base)
                ->selectRaw("COALESCE(source, 'unknown') as source, COUNT(*) as total")
                ->groupBy('source')
                ->orderByDesc('total')
                ->get()
                ->map(fn ($row) => ['source' => $row->source, 'total' => (int) $row->total])
                ->all(),
        ];
    }

    /** @return array<string, mixed> */
    public function formatSession(AbandonedBookingSession $session): array
    {
        return [
            'uuid' => $session->uuid,
            'client_email' => $session->client_email,
            'client_phone' => $session->client_phone,
            'client_name' => $session->client_name,
            'draft' => $session->draft ?? [],
            'status' => $session->status?->value ?? $session->status,
            'last_activity_at' => $session->last_activity_at?->toIso8601String(),
            'recovered_at' => $session->recovered_at?->toIso8601String(),
            'recovered_appointment_id' => $session->recovered_appointment_id,
            'reminder_count' => (int) $session->reminder_count,
            'last_reminder_at' => $session->last_reminder_at?->toIso8601String(),
            'source' => $session->source,
        ];
    }
}
