<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Bookings\StoreWaitlistRequest;
use App\Services\BookingService;
use Illuminate\Http\JsonResponse;

class BookingWaitlistController extends Controller
{
    public function store(StoreWaitlistRequest $request, BookingService $booking): JsonResponse
    {
        $entry = $booking->createWaitlistEntry([
            ...$request->validated(),
            'client_user_id' => $request->user()?->id,
        ]);

        return response()->json([
            'data' => [
                'uuid' => $entry->uuid,
                'status' => $entry->status,
                'preferred_date' => $entry->preferred_date->toDateString(),
                'preferred_time' => $entry->preferred_time,
            ],
            'message' => 'You have been added to the waitlist. We will notify you when a slot opens.',
        ], 201);
    }
}
