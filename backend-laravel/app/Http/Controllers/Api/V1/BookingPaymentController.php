<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\AppointmentResource;
use App\Http\Resources\PaymentTransactionResource;
use App\Models\Appointment;
use App\Services\PaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use InvalidArgumentException;

class BookingPaymentController extends Controller
{
    public function checkout(
        Request $request,
        string $uuid,
        PaymentService $payments,
    ): JsonResponse {
        $appointment = Appointment::query()
            ->where('uuid', $uuid)
            ->with(['service', 'tenant', 'client'])
            ->firstOrFail();

        $validated = $request->validate([
            'purpose' => ['required', Rule::in(['booking', 'deposit'])],
            'provider' => ['required', Rule::in(['paystack', 'flutterwave'])],
            'email' => ['required', 'email'],
            'name' => ['nullable', 'string', 'max:120'],
            'coupon_code' => ['nullable', 'string', 'max:50'],
        ]);

        try {
            $result = $payments->checkoutForAppointment(
                $appointment,
                $validated['purpose'],
                $validated['provider'],
                $validated['email'],
                $validated['name'] ?? null,
                $validated['coupon_code'] ?? null,
            );
        } catch (InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json($result);
    }

    public function verify(Request $request, PaymentService $payments): JsonResponse
    {
        $validated = $request->validate([
            'reference' => ['required', 'string'],
        ]);

        $paid = $payments->reconcileByReference($validated['reference']);

        if (! $paid) {
            return response()->json(['paid' => false, 'message' => 'Payment not verified'], 402);
        }

        $transaction = \App\Models\PaymentTransaction::query()
            ->where('provider_reference', $validated['reference'])
            ->with('appointment.service')
            ->first();

        return response()->json([
            'paid' => true,
            'transaction' => $transaction ? new PaymentTransactionResource($transaction) : null,
            'appointment' => $transaction?->appointment
                ? new AppointmentResource($transaction->appointment)
                : null,
        ]);
    }
}
