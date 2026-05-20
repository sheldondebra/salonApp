<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\PlatformSubscription;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SubscriptionAdminController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = PlatformSubscription::query()
            ->with(['user:id,uuid,name,email', 'coupon:id,code'])
            ->orderByDesc('created_at');

        if ($request->filled('status')) {
            $query->where('status', $request->string('status')->toString());
        }

        if ($request->filled('plan_id')) {
            $query->where('plan_id', $request->string('plan_id')->toString());
        }

        if ($search = $request->string('q')->trim()->toString()) {
            $query->whereHas('user', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $paginated = $query->paginate(min($request->integer('per_page', 20), 50));

        $summary = [
            'total' => PlatformSubscription::query()->count(),
            'paid' => PlatformSubscription::query()->where('status', 'paid')->count(),
            'pending' => PlatformSubscription::query()->where('status', 'pending')->count(),
            'mrr_cents' => (int) PlatformSubscription::query()
                ->where('status', 'paid')
                ->where('paid_at', '>=', now()->subMonth())
                ->sum('final_amount_cents'),
        ];

        return response()->json(array_merge($paginated->toArray(), ['summary' => $summary]));
    }
}
