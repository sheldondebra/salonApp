<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\CheckoutSession;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CheckoutSessionService
{
    public function __construct(
        private readonly PosService $posService,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function show(CheckoutSession $session): array
    {
        return $this->formatSession($session, $this->preview($session));
    }

  /**
     * @param  array<string, mixed>  $data
     */
    public function create(Tenant $tenant, User $actor, array $data): CheckoutSession
    {
        return CheckoutSession::query()->create([
            'tenant_id' => $tenant->id,
            'location_id' => $data['location_id'],
            'client_user_id' => $data['client_user_id'] ?? null,
            'appointment_id' => $this->resolveAppointmentId($tenant->id, $data['appointment_uuid'] ?? null),
            'created_by_user_id' => $actor->id,
            'status' => 'open',
            'items' => $data['items'] ?? [],
            'coupon_code' => $data['coupon_code'] ?? null,
            'tax_cents' => (int) ($data['tax_cents'] ?? 0),
            'service_charge_cents' => (int) ($data['service_charge_cents'] ?? 0),
            'tip_cents' => (int) ($data['tip_cents'] ?? 0),
            'notes' => $data['notes'] ?? null,
        ]);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(CheckoutSession $session, array $data): CheckoutSession
    {
        if ($session->status !== 'open') {
            throw ValidationException::withMessages([
                'session' => ['This checkout session is no longer open.'],
            ]);
        }

        if (array_key_exists('location_id', $data)) {
            $session->location_id = (int) $data['location_id'];
        }
        if (array_key_exists('client_user_id', $data)) {
            $session->client_user_id = $data['client_user_id'];
        }
        if (array_key_exists('appointment_uuid', $data)) {
            $session->appointment_id = $this->resolveAppointmentId($session->tenant_id, $data['appointment_uuid']);
        }
        if (array_key_exists('items', $data)) {
            $session->items = $data['items'];
        }
        if (array_key_exists('coupon_code', $data)) {
            $session->coupon_code = $data['coupon_code'];
        }
        if (array_key_exists('tax_cents', $data)) {
            $session->tax_cents = (int) $data['tax_cents'];
        }
        if (array_key_exists('service_charge_cents', $data)) {
            $session->service_charge_cents = (int) $data['service_charge_cents'];
        }
        if (array_key_exists('tip_cents', $data)) {
            $session->tip_cents = (int) $data['tip_cents'];
        }
        if (array_key_exists('notes', $data)) {
            $session->notes = $data['notes'];
        }

        $session->save();

        return $session->fresh(['location', 'client']);
    }

    /**
     * @return array<string, int|string>
     */
    public function preview(CheckoutSession $session): array
    {
        return $this->posService->previewTotals(
            $session->tenant_id,
            (int) $session->location_id,
            $session->items ?? [],
            (int) $session->tax_cents,
            (int) $session->service_charge_cents,
            (int) $session->tip_cents,
            $session->coupon_code,
            0,
        );
    }

    /**
     * @return array{session: CheckoutSession, sale: \App\Models\Sale}
     */
    public function complete(CheckoutSession $session, string $paymentMethod, ?User $actor = null, array $options = []): array
    {
        if ($session->status !== 'open') {
            throw ValidationException::withMessages([
                'session' => ['This checkout session is already completed.'],
            ]);
        }

        if ($session->expires_at && $session->expires_at->isPast()) {
            throw ValidationException::withMessages([
                'session' => ['This checkout session has expired.'],
            ]);
        }

        return DB::transaction(function () use ($session, $paymentMethod, $actor, $options) {
            $appointmentUuid = null;
            if ($session->appointment_id) {
                $appointmentUuid = Appointment::query()
                    ->where('id', $session->appointment_id)
                    ->value('uuid');
            }

            $sale = $this->posService->completeSale([
                'location_id' => $session->location_id,
                'client_user_id' => $session->client_user_id,
                'appointment_uuid' => $appointmentUuid,
                'items' => $session->items ?? [],
                'coupon_code' => $session->coupon_code,
                'tax_cents' => (int) $session->tax_cents,
                'service_charge_cents' => (int) $session->service_charge_cents,
                'tip_cents' => (int) $session->tip_cents,
                'manual_discount_cents' => (int) ($options['manual_discount_cents'] ?? 0),
                'approval_request_uuid' => $options['approval_request_uuid'] ?? null,
                'payment_method' => $paymentMethod,
                'notes' => $session->notes,
            ], $actor ?? throw ValidationException::withMessages([
                'user' => ['Cashier is required to complete checkout.'],
            ]));

            $session->update([
                'status' => 'completed',
                'payment_method' => $paymentMethod,
                'sale_id' => $sale->id,
            ]);

            return [
                'session' => $session->fresh(['sale', 'location', 'client']),
                'sale' => $sale,
            ];
        });
    }

    /**
     * @param  array<string, int|string>  $totals
     * @return array<string, mixed>
     */
    private function formatSession(CheckoutSession $session, array $totals): array
    {
        $session->loadMissing(['location:id,name', 'client:id,name,email,phone']);

        return [
            'uuid' => $session->uuid,
            'status' => $session->status,
            'location_id' => $session->location_id,
            'client_user_id' => $session->client_user_id,
            'appointment_id' => $session->appointment_id,
            'items' => $session->items ?? [],
            'coupon_code' => $session->coupon_code,
            'tax_cents' => (int) $session->tax_cents,
            'service_charge_cents' => (int) $session->service_charge_cents,
            'tip_cents' => (int) $session->tip_cents,
            'payment_method' => $session->payment_method,
            'notes' => $session->notes,
            'sale_id' => $session->sale_id,
            'expires_at' => $session->expires_at?->toIso8601String(),
            'location' => $session->location,
            'client' => $session->client,
            'totals' => $totals,
        ];
    }

    private function resolveAppointmentId(int $tenantId, ?string $uuid): ?int
    {
        if (! $uuid) {
            return null;
        }

        return Appointment::query()
            ->where('tenant_id', $tenantId)
            ->where('uuid', $uuid)
            ->value('id');
    }
}
