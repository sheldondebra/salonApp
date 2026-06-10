<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\V1\Concerns\ResolvesTenantFromRequest;
use App\Http\Controllers\Controller;
use App\Models\Review;
use App\Services\ReviewService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PublicReviewController extends Controller
{
    use ResolvesTenantFromRequest;

    public function __construct(
        private readonly ReviewService $reviews,
    ) {}

    public function index(Request $request, string $tenantSlug): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);
        $filters = $request->validate([
            'rating' => ['nullable', 'integer', 'min:1', 'max:5'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        $paginator = $this->reviews->publicApprovedReviews($tenant->id, $filters, (int) ($filters['per_page'] ?? 20));

        return response()->json([
            'data' => collect($paginator->items())->map(fn (Review $review) => $this->reviews->formatReview($review)),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }

    public function submit(Request $request, string $tenantSlug, string $token): JsonResponse
    {
        $this->tenant($request, $tenantSlug);
        $data = $request->validate([
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'comment' => ['nullable', 'string', 'max:5000'],
            'staff_member_id' => ['nullable', 'integer', 'exists:staff_members,id'],
            'service_id' => ['nullable', 'integer', 'exists:services,id'],
        ]);

        $review = $this->reviews->submitReview($tenantSlug, $token, $data);

        return response()->json(['data' => $this->reviews->formatReview($review)], 201);
    }
}
