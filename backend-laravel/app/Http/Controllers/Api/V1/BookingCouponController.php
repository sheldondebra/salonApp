<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\CouponScope;
use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Services\CouponService;
use App\Services\PaymentService;
use App\Support\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class BookingCouponController extends Controller
{
    public function validate(Request $request, CouponService $coupons, PaymentService $payments): JsonResponse
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'max:50'],
            'appointment_uuid' => ['nullable', 'uuid'],
            'purpose' => ['nullable', Rule::in(['booking', 'deposit'])],
            'amount_cents' => ['nullable', 'integer', 'min:0'],
        ]);

        $tenant = TenantContext::get();
        if (! $tenant) {
            return response()->json(['message' => 'Tenant not found'], 404);
        }

        $appointment = null;
        if (! empty($validated['appointment_uuid'])) {
            $appointment = Appointment::query()
                ->where('uuid', $validated['appointment_uuid'])
                ->with(['service', 'bookingGroup.appointments'])
                ->firstOrFail();
        }

        $amountCents = (int) ($validated['amount_cents'] ?? 0);

        if ($amountCents <= 0 && $appointment) {
            $totalCents = $payments->appointmentTotalCents($appointment);
            $purpose = $validated['purpose'] ?? 'deposit';
            $amountCents = $purpose === 'booking'
                ? $totalCents
                : max(1, (int) round($totalCents * ($tenant->depositPercent() / 100)));
        }

        if ($amountCents <= 0) {
            return response()->json(['message' => 'Amount is required to validate a coupon.'], 422);
        }

        $serviceIds = [];
        if ($appointment) {
            if ($appointment->bookingGroup) {
                $serviceIds = $appointment->bookingGroup->appointments->pluck('service_id')->filter()->all();
            } elseif ($appointment->service_id) {
                $serviceIds = [$appointment->service_id];
            }
        }

        $result = $coupons->validate($validated['code'], [
            'scope' => CouponScope::Booking,
            'tenant_id' => $tenant->id,
            'service_ids' => array_values($serviceIds),
            'amount_cents' => $amountCents,
        ]);

        return response()->json([
            'valid' => $result['valid'],
            'message' => $result['message'],
            'discount_cents' => $result['discount_cents'],
            'final_amount_cents' => $result['final_amount_cents'],
        ]);
    }
}
