<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\ReviewStatus;
use App\Http\Controllers\Api\V1\Concerns\ResolvesTenantFromRequest;
use App\Http\Controllers\Controller;
use App\Models\Review;
use App\Models\ReviewRequest;
use App\Services\ReviewService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ReviewController extends Controller
{
    use ResolvesTenantFromRequest;

    public function __construct(
        private readonly ReviewService $reviews,
    ) {}

    public function settings(Request $request, string $tenantSlug): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);

        return response()->json(['data' => $this->reviews->formatSettings($this->reviews->settings($tenant->id))]);
    }

    public function updateSettings(Request $request, string $tenantSlug): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);
        $data = $request->validate([
            'auto_send_after_appointment' => ['nullable', 'boolean'],
            'auto_send' => ['nullable', 'boolean'],
            'delay_hours' => ['nullable', 'integer', 'min:0', 'max:168'],
            'send_delay_hours' => ['nullable', 'integer', 'min:0', 'max:168'],
            'request_message_template' => ['nullable', 'string', 'max:5000'],
            'google_review_url' => ['nullable', 'url', 'max:1000'],
            'auto_send_google_review' => ['nullable', 'boolean'],
            'low_rating_threshold' => ['nullable', 'integer', 'min:1', 'max:5'],
            'min_rating_public' => ['nullable', 'integer', 'min:1', 'max:5'],
        ]);

        if (array_key_exists('auto_send', $data)) {
            $data['auto_send_after_appointment'] = $data['auto_send'];
        }
        if (array_key_exists('send_delay_hours', $data)) {
            $data['delay_hours'] = $data['send_delay_hours'];
        }
        if (array_key_exists('min_rating_public', $data)) {
            $data['low_rating_threshold'] = $data['min_rating_public'];
        }

        $settings = $this->reviews->updateSettings($tenant->id, array_filter([
            'auto_send_after_appointment' => $data['auto_send_after_appointment'] ?? null,
            'delay_hours' => $data['delay_hours'] ?? null,
            'request_message_template' => $data['request_message_template'] ?? null,
            'google_review_url' => $data['google_review_url'] ?? null,
            'auto_send_google_review' => $data['auto_send_google_review'] ?? null,
            'low_rating_threshold' => $data['low_rating_threshold'] ?? null,
        ], fn ($v) => $v !== null));

        return response()->json(['data' => $this->reviews->formatSettings($settings)]);
    }

    public function requests(Request $request, string $tenantSlug): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);
        $filters = $request->validate([
            'status' => ['nullable', 'string', 'max:32'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        $paginator = $this->reviews->listRequests($tenant->id, $filters, (int) ($filters['per_page'] ?? 20));

        return response()->json([
            'data' => collect($paginator->items())->map(fn (ReviewRequest $reviewRequest) => $this->reviews->formatRequest($reviewRequest)),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }

    public function sendRequest(Request $request, string $tenantSlug): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);
        $data = $request->validate([
            'appointment_uuid' => ['nullable', 'string', 'max:36'],
            'client_user_id' => ['nullable', 'integer', 'exists:users,id'],
            'client_email' => ['nullable', 'email', 'max:255'],
        ]);

        $reviewRequest = $this->reviews->sendRequestPlaceholder($tenant->id, $data);

        return response()->json(['data' => $this->reviews->formatRequest($reviewRequest)], 201);
    }

    public function googleSend(Request $request, string $tenantSlug, ReviewRequest $reviewRequest): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);
        abort_unless($reviewRequest->tenant_id === $tenant->id, 404);

        return response()->json(['data' => $this->reviews->googleSendPlaceholder($reviewRequest)]);
    }

    public function index(Request $request, string $tenantSlug): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);
        $filters = $request->validate([
            'status' => ['nullable', 'string', Rule::in(array_column(ReviewStatus::cases(), 'value'))],
            'rating' => ['nullable', 'integer', 'min:1', 'max:5'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        $paginator = $this->reviews->listReviews($tenant->id, $filters, (int) ($filters['per_page'] ?? 20));

        return response()->json([
            'data' => collect($paginator->items())->map(fn (Review $review) => $this->reviews->formatReview($review)),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }

    public function moderate(Request $request, string $tenantSlug, Review $review): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);
        abort_unless($review->tenant_id === $tenant->id, 404);

        $data = $request->validate([
            'status' => ['required', 'string', Rule::in(array_column(ReviewStatus::cases(), 'value'))],
        ]);

        $review = $this->reviews->moderate($review, ReviewStatus::from($data['status']));

        return response()->json(['data' => $this->reviews->formatReview($review)]);
    }

    public function complaintCases(Request $request, string $tenantSlug): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);
        $filters = $request->validate([
            'status' => ['nullable', 'string', 'max:32'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        $paginator = $this->reviews->listComplaints($tenant->id, $filters, (int) ($filters['per_page'] ?? 20));

        return response()->json([
            'data' => collect($paginator->items())->map(fn ($case) => $this->reviews->formatComplaint($case)),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }
}
