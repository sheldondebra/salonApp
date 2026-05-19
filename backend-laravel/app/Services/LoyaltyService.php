<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\LoyaltyTransaction;
use App\Models\LoyaltyWallet;
use App\Models\User;
use App\Support\TenantContext;
use Illuminate\Support\Facades\DB;

class LoyaltyService
{
    public function walletFor(User $user, ?int $tenantId = null): LoyaltyWallet
    {
        $tenantId ??= TenantContext::id();

        return LoyaltyWallet::query()->firstOrCreate(
            ['user_id' => $user->id, 'tenant_id' => $tenantId],
            ['points_balance' => 0, 'lifetime_points' => 0]
        );
    }

    public function awardForAppointment(Appointment $appointment, int $pointsPerDollar = 1): void
    {
        if (! $appointment->client_user_id) {
            return;
        }

        $service = $appointment->service;
        $points = (int) floor(($service?->price_cents ?? 0) / 100) * $pointsPerDollar;

        if ($points <= 0) {
            return;
        }

        $this->addPoints(
            User::query()->find($appointment->client_user_id),
            $points,
            'earn',
            'Points earned for booking',
            $appointment->tenant_id,
            $appointment->id
        );
    }

    public function addPoints(
        User $user,
        int $points,
        string $type,
        string $description,
        ?int $tenantId = null,
        ?int $appointmentId = null
    ): LoyaltyWallet {
        return DB::transaction(function () use ($user, $points, $type, $description, $tenantId, $appointmentId) {
            $wallet = $this->walletFor($user, $tenantId);
            $wallet->points_balance += $points;
            if ($points > 0) {
                $wallet->lifetime_points += $points;
            }
            $wallet->save();

            LoyaltyTransaction::query()->create([
                'loyalty_wallet_id' => $wallet->id,
                'points' => $points,
                'type' => $type,
                'description' => $description,
                'appointment_id' => $appointmentId,
            ]);

            return $wallet->fresh();
        });
    }
}
