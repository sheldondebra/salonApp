<?php

namespace App\Services;

use App\Enums\UserType;
use App\Models\Appointment;
use App\Models\ClientAllergy;
use App\Models\ClientDocument;
use App\Models\ClientMedia;
use App\Models\ClientNote;
use App\Models\ClientPatchTest;
use App\Models\ClientProfile;
use App\Models\ClientTreatment;
use App\Models\LoyaltyWallet;
use App\Models\PaymentRequest;
use App\Models\PaymentTransaction;
use App\Models\Sale;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Str;

class ClientProfileService
{
    public function assertClientForTenant(User $client, int $tenantId): void
    {
        abort_unless(
            $client->user_type === UserType::Client
            && $client->tenants()->where('tenants.id', $tenantId)->exists(),
            404
        );
    }

  /**
   * @return array<string, mixed>
   */
    public function show(int $tenantId, User $client): array
    {
        $this->assertClientForTenant($client, $tenantId);

        $profile = ClientProfile::query()->firstOrCreate(
            ['tenant_id' => $tenantId, 'user_id' => $client->id]
        );

        $profile->load('preferredStaffMember:id,display_name');

        $stats = $this->stats($tenantId, $client->id);
        $loyalty = $this->loyalty($tenantId, $client->id);

        return [
            'client' => [
                'id' => $client->id,
                'uuid' => $client->uuid,
                'name' => $client->name,
                'email' => $client->email,
                'phone' => $client->phone,
                'avatar_url' => $client->avatar_url,
                'bio' => $client->bio,
                'date_of_birth' => $client->date_of_birth?->toDateString(),
                'is_active' => $client->is_active,
                'marketing_opt_in' => (bool) $client->marketing_opt_in,
            ],
            'profile' => $this->formatProfile($profile),
            'stats' => $stats,
            'loyalty' => $loyalty,
            'visits' => $this->visits($tenantId, $client->id, 20),
            'notes' => $this->notes($tenantId, $client->id),
            'allergies' => $this->allergies($tenantId, $client->id),
            'patch_tests' => $this->patchTests($tenantId, $client->id),
            'treatments' => $this->treatments($tenantId, $client->id),
            'media' => $this->media($tenantId, $client->id),
            'documents' => $this->documents($tenantId, $client->id),
            'payments' => $this->payments($tenantId, $client->id, 15),
            'timeline' => $this->timeline($tenantId, $client->id),
        ];
    }

    public function updateProfile(int $tenantId, User $client, array $data): ClientProfile
    {
        $this->assertClientForTenant($client, $tenantId);

        $profile = ClientProfile::query()->firstOrCreate(
            ['tenant_id' => $tenantId, 'user_id' => $client->id]
        );

        $profile->update($data);

        return $profile->fresh('preferredStaffMember:id,display_name');
    }

    /**
     * @return array<string, mixed>
     */
    protected function formatProfile(ClientProfile $profile): array
    {
        return [
            'preferred_staff_member_id' => $profile->preferred_staff_member_id,
            'preferred_staff_name' => $profile->preferredStaffMember?->display_name,
            'preferred_contact' => $profile->preferred_contact,
            'sms_reminders' => (bool) $profile->sms_reminders,
            'email_marketing' => (bool) $profile->email_marketing,
            'sms_marketing' => (bool) $profile->sms_marketing,
            'tags' => $profile->tags ?? [],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    protected function stats(int $tenantId, int $clientUserId): array
    {
        $appointments = Appointment::query()
            ->withoutGlobalScope('tenant')
            ->where('tenant_id', $tenantId)
            ->where('client_user_id', $clientUserId);

        $completed = (clone $appointments)->where('status', 'completed');
        $lastVisit = (clone $completed)->with('service:id,name')->orderByDesc('starts_at')->first();
        $nextBooking = (clone $appointments)
            ->with('service:id,name')
            ->where('starts_at', '>=', now())
            ->whereNotIn('status', ['cancelled', 'no_show'])
            ->orderBy('starts_at')
            ->first();

        $paidTransactions = (int) PaymentTransaction::query()
            ->withoutGlobalScope('tenant')
            ->where('tenant_id', $tenantId)
            ->where('user_id', $clientUserId)
            ->where('status', 'paid')
            ->sum('amount_cents');

        $paidSales = (int) Sale::query()
            ->where('tenant_id', $tenantId)
            ->where('client_user_id', $clientUserId)
            ->where('status', 'completed')
            ->whereDoesntHave('payment', fn ($q) => $q->where('status', 'paid'))
            ->sum('total_cents');

        $paidRequests = (int) PaymentRequest::query()
            ->where('tenant_id', $tenantId)
            ->where('customer_id', $clientUserId)
            ->where('status', 'success')
            ->sum('amount_cents');

        return [
            'total_spend_cents' => $paidTransactions + $paidSales + $paidRequests,
            'visit_count' => (clone $appointments)->whereIn('status', ['completed', 'confirmed'])->count(),
            'last_visit_at' => $lastVisit?->starts_at?->toIso8601String(),
            'last_visit_service' => $lastVisit?->service?->name,
            'next_booking_at' => $nextBooking?->starts_at?->toIso8601String(),
            'next_booking_service' => $nextBooking?->service?->name,
            'no_show_count' => (clone $appointments)->where('status', 'no_show')->count(),
            'appointments_count' => (clone $appointments)->count(),
        ];
    }

    /**
     * @return array<string, mixed>|null
     */
    protected function loyalty(int $tenantId, int $clientUserId): ?array
    {
        $wallet = LoyaltyWallet::query()
            ->where('tenant_id', $tenantId)
            ->where('user_id', $clientUserId)
            ->with(['transactions' => fn ($q) => $q->orderByDesc('created_at')->limit(10)])
            ->first();

        if (! $wallet) {
            return null;
        }

        return [
            'points_balance' => (int) $wallet->points_balance,
            'lifetime_points' => (int) $wallet->lifetime_points,
            'recent_transactions' => $wallet->transactions->map(fn ($tx) => [
                'id' => $tx->id,
                'points' => (int) $tx->points,
                'type' => $tx->type,
                'description' => $tx->description,
                'created_at' => $tx->created_at?->toIso8601String(),
            ])->values()->all(),
        ];
    }

    /**
     * @return list<array<string, mixed>>
     */
    protected function visits(int $tenantId, int $clientUserId, int $limit): array
    {
        return Appointment::query()
            ->withoutGlobalScope('tenant')
            ->where('tenant_id', $tenantId)
            ->where('client_user_id', $clientUserId)
            ->with(['service:id,name', 'staffMember:id,display_name'])
            ->orderByDesc('starts_at')
            ->limit($limit)
            ->get()
            ->map(fn (Appointment $apt) => [
                'id' => $apt->id,
                'uuid' => $apt->uuid,
                'starts_at' => $apt->starts_at?->toIso8601String(),
                'status' => $apt->status,
                'service_name' => $apt->service?->name,
                'staff_name' => $apt->staffMember?->display_name,
                'amount_due_cents' => (int) ($apt->amount_due_cents ?? 0),
                'payment_status' => $apt->payment_status ?? 'unpaid',
                'notes' => $apt->notes,
            ])
            ->values()
            ->all();
    }

    /**
     * @return list<array<string, mixed>>
     */
    protected function notes(int $tenantId, int $clientUserId): array
    {
        return ClientNote::query()
            ->where('user_id', $clientUserId)
            ->with('author:id,name')
            ->orderByDesc('is_pinned')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (ClientNote $note) => [
                'id' => $note->id,
                'body' => $note->body,
                'is_pinned' => (bool) $note->is_pinned,
                'author_name' => $note->author?->name,
                'created_at' => $note->created_at?->toIso8601String(),
            ])
            ->values()
            ->all();
    }

    /**
     * @return list<array<string, mixed>>
     */
    protected function allergies(int $tenantId, int $clientUserId): array
    {
        return ClientAllergy::query()
            ->where('user_id', $clientUserId)
            ->orderByDesc('is_active')
            ->orderBy('allergen')
            ->get()
            ->map(fn (ClientAllergy $row) => [
                'id' => $row->id,
                'allergen' => $row->allergen,
                'severity' => $row->severity,
                'reaction_notes' => $row->reaction_notes,
                'is_active' => (bool) $row->is_active,
            ])
            ->values()
            ->all();
    }

    /**
     * @return list<array<string, mixed>>
     */
    protected function patchTests(int $tenantId, int $clientUserId): array
    {
        return ClientPatchTest::query()
            ->where('user_id', $clientUserId)
            ->with('staffMember:id,display_name')
            ->orderByDesc('tested_on')
            ->get()
            ->map(fn (ClientPatchTest $row) => [
                'id' => $row->id,
                'product_name' => $row->product_name,
                'tested_on' => $row->tested_on?->toDateString(),
                'expires_on' => $row->expires_on?->toDateString(),
                'result' => $row->result,
                'notes' => $row->notes,
                'staff_name' => $row->staffMember?->display_name,
            ])
            ->values()
            ->all();
    }

    /**
     * @return list<array<string, mixed>>
     */
    protected function treatments(int $tenantId, int $clientUserId): array
    {
        return ClientTreatment::query()
            ->where('user_id', $clientUserId)
            ->with('staffMember:id,display_name')
            ->orderByDesc('treated_at')
            ->get()
            ->map(fn (ClientTreatment $row) => [
                'id' => $row->id,
                'service_name' => $row->service_name,
                'treated_at' => $row->treated_at?->toIso8601String(),
                'outcome' => $row->outcome,
                'notes' => $row->notes,
                'staff_name' => $row->staffMember?->display_name,
            ])
            ->values()
            ->all();
    }

    /**
     * @return list<array<string, mixed>>
     */
    protected function media(int $tenantId, int $clientUserId): array
    {
        return ClientMedia::query()
            ->where('user_id', $clientUserId)
            ->orderByDesc('taken_at')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (ClientMedia $row) => [
                'id' => $row->id,
                'kind' => $row->kind,
                'url' => $row->url,
                'caption' => $row->caption,
                'taken_at' => $row->taken_at?->toIso8601String(),
            ])
            ->values()
            ->all();
    }

    /**
     * @return list<array<string, mixed>>
     */
    protected function documents(int $tenantId, int $clientUserId): array
    {
        return ClientDocument::query()
            ->where('user_id', $clientUserId)
            ->with('uploadedBy:id,name')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (ClientDocument $row) => [
                'id' => $row->id,
                'title' => $row->title,
                'file_url' => $row->file_url,
                'mime_type' => $row->mime_type,
                'uploaded_by_name' => $row->uploadedBy?->name,
                'created_at' => $row->created_at?->toIso8601String(),
            ])
            ->values()
            ->all();
    }

    /**
     * @return list<array<string, mixed>>
     */
    protected function payments(int $tenantId, int $clientUserId, int $limit): array
    {
        $requests = PaymentRequest::query()
            ->where('customer_id', $clientUserId)
            ->orderByDesc('created_at')
            ->limit($limit)
            ->get()
            ->map(fn (PaymentRequest $row) => [
                'id' => $row->id,
                'source' => 'payment_request',
                'reference' => $row->reference,
                'status' => $row->status->value ?? (string) $row->status,
                'amount_cents' => (int) $row->amount_cents,
                'currency' => $row->currency,
                'occurred_at' => $row->paid_at?->toIso8601String() ?? $row->created_at?->toIso8601String(),
            ]);

        $transactions = PaymentTransaction::query()
            ->withoutGlobalScope('tenant')
            ->where('tenant_id', $tenantId)
            ->where('user_id', $clientUserId)
            ->orderByDesc('created_at')
            ->limit($limit)
            ->get()
            ->map(fn (PaymentTransaction $row) => [
                'id' => $row->id,
                'source' => 'payment_transaction',
                'reference' => $row->provider_reference ?? $row->uuid,
                'status' => $row->status,
                'amount_cents' => (int) $row->amount_cents,
                'currency' => $row->currency,
                'occurred_at' => $row->paid_at?->toIso8601String() ?? $row->created_at?->toIso8601String(),
            ]);

        return $requests
            ->merge($transactions)
            ->sortByDesc('occurred_at')
            ->take($limit)
            ->values()
            ->all();
    }

    /**
     * @return list<array<string, mixed>>
     */
    protected function timeline(int $tenantId, int $clientUserId): array
    {
        $events = collect();

        foreach ($this->visits($tenantId, $clientUserId, 15) as $visit) {
            $events->push([
                'type' => 'visit',
                'title' => $visit['service_name'] ?? 'Appointment',
                'subtitle' => $visit['status'],
                'occurred_at' => $visit['starts_at'],
            ]);
        }

        foreach ($this->notes($tenantId, $clientUserId) as $note) {
            $events->push([
                'type' => 'note',
                'title' => 'Staff note',
                'subtitle' => Str::limit($note['body'], 80),
                'occurred_at' => $note['created_at'],
            ]);
        }

        foreach ($this->treatments($tenantId, $clientUserId) as $treatment) {
            $events->push([
                'type' => 'treatment',
                'title' => $treatment['service_name'],
                'subtitle' => $treatment['outcome'] ?? 'Treatment recorded',
                'occurred_at' => $treatment['treated_at'],
            ]);
        }

        foreach ($this->payments($tenantId, $clientUserId, 10) as $payment) {
            $events->push([
                'type' => 'payment',
                'title' => 'Payment '.$payment['reference'],
                'subtitle' => $payment['status'],
                'occurred_at' => $payment['occurred_at'],
            ]);
        }

        return $events
            ->filter(fn ($e) => ! empty($e['occurred_at']))
            ->sortByDesc('occurred_at')
            ->take(25)
            ->values()
            ->all();
    }
}
