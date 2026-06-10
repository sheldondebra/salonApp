<?php

namespace App\Services;

use App\Enums\ComplaintCaseStatus;
use App\Enums\ReviewStatus;
use App\Models\Appointment;
use App\Models\ComplaintCase;
use App\Models\Review;
use App\Models\ReviewRequest;
use App\Models\ReviewSetting;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class ReviewService
{
    public function settings(int $tenantId): ReviewSetting
    {
        return ReviewSetting::query()->firstOrCreate(
            ['tenant_id' => $tenantId],
            [
                'auto_send_after_appointment' => true,
                'delay_hours' => 2,
                'auto_send_google_review' => false,
                'low_rating_threshold' => 3,
            ]
        );
    }

    public function updateSettings(int $tenantId, array $data): ReviewSetting
    {
        $settings = $this->settings($tenantId);
        $settings->update($data);

        return $settings->fresh();
    }

    public function listRequests(int $tenantId, array $filters = [], int $perPage = 20): LengthAwarePaginator
    {
        $query = ReviewRequest::query()
            ->where('tenant_id', $tenantId)
            ->with(['appointment:id,uuid,starts_at', 'client:id,name,email', 'review:id,uuid,rating,status,review_request_id'])
            ->latest();

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        return $query->paginate(min($perPage, 50));
    }

    public function listReviews(int $tenantId, array $filters = [], int $perPage = 20): LengthAwarePaginator
    {
        $query = Review::query()
            ->where('tenant_id', $tenantId)
            ->with(['request:id,uuid,token', 'client:id,name,email', 'staffMember:id,uuid,display_name', 'service:id,uuid,name', 'complaintCase'])
            ->latest();

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (! empty($filters['rating'])) {
            $query->where('rating', (int) $filters['rating']);
        }

        return $query->paginate(min($perPage, 50));
    }

    public function publicApprovedReviews(int $tenantId, array $filters = [], int $perPage = 20): LengthAwarePaginator
    {
        $query = Review::query()
            ->where('tenant_id', $tenantId)
            ->where('status', ReviewStatus::Approved)
            ->with(['staffMember:id,uuid,display_name', 'service:id,uuid,name'])
            ->latest();

        if (! empty($filters['rating'])) {
            $query->where('rating', '>=', (int) $filters['rating']);
        }

        return $query->paginate(min($perPage, 50));
    }

    public function sendRequestPlaceholder(int $tenantId, array $data): ReviewRequest
    {
        $appointment = null;
        if (! empty($data['appointment_uuid'])) {
            $appointment = Appointment::query()
                ->where('tenant_id', $tenantId)
                ->where('uuid', $data['appointment_uuid'])
                ->with('client:id,email')
                ->firstOrFail();
        }

        return ReviewRequest::query()->create([
            'tenant_id' => $tenantId,
            'appointment_id' => $appointment?->id,
            'client_user_id' => $data['client_user_id'] ?? $appointment?->client_user_id,
            'client_email' => $data['client_email'] ?? $appointment?->client?->email,
            'status' => 'sent',
            'sent_at' => now(),
            'token' => Str::random(48),
        ])->fresh(['appointment', 'client']);
    }

    public function submitReview(string $tenantSlug, string $token, array $data): Review
    {
        $request = ReviewRequest::query()
            ->whereHas('tenant', fn ($q) => $q->where('slug', $tenantSlug))
            ->where('token', $token)
            ->firstOrFail();

        if ($request->completed_at) {
            throw ValidationException::withMessages(['token' => ['This review link has already been used.']]);
        }

        $review = DB::transaction(function () use ($request, $data) {
            $review = Review::query()->create([
                'tenant_id' => $request->tenant_id,
                'review_request_id' => $request->id,
                'appointment_id' => $request->appointment_id,
                'client_user_id' => $request->client_user_id,
                'staff_member_id' => $data['staff_member_id'] ?? null,
                'service_id' => $data['service_id'] ?? null,
                'rating' => (int) $data['rating'],
                'comment' => $data['comment'] ?? null,
                'status' => ReviewStatus::Pending,
                'is_verified' => true,
                'source' => 'internal',
            ]);

            $request->update([
                'status' => 'completed',
                'completed_at' => now(),
            ]);

            $this->createComplaintIfNeeded($review);

            return $review;
        });

        return $review->fresh(['request', 'client', 'staffMember', 'service', 'complaintCase']);
    }

    public function moderate(Review $review, ReviewStatus $status): Review
    {
        $review->update(['status' => $status]);

        return $review->fresh(['complaintCase', 'staffMember', 'service']);
    }

    public function googleSendPlaceholder(ReviewRequest $request): array
    {
        $settings = $this->settings($request->tenant_id);
        $request->update(['google_review_sent' => true]);

        return [
            'queued' => ! empty($settings->google_review_url),
            'google_review_url' => $settings->google_review_url,
            'message' => $settings->google_review_url
                ? 'Google review placeholder marked as sent.'
                : 'No Google review URL configured yet.',
        ];
    }

    public function formatSettings(ReviewSetting $settings): array
    {
        return [
            'id' => $settings->id,
            'uuid' => $settings->uuid ?? null,
            'auto_send_after_appointment' => (bool) $settings->auto_send_after_appointment,
            'auto_send' => (bool) $settings->auto_send_after_appointment,
            'delay_hours' => (int) $settings->delay_hours,
            'send_delay_hours' => (int) $settings->delay_hours,
            'request_message_template' => $settings->request_message_template,
            'google_review_url' => $settings->google_review_url,
            'auto_send_google_review' => (bool) $settings->auto_send_google_review,
            'low_rating_threshold' => (int) $settings->low_rating_threshold,
            'min_rating_public' => (int) $settings->low_rating_threshold,
            'collect_private_feedback' => true,
            'allow_anonymous' => false,
            'escalation_email' => null,
            'reply_sla_hours' => 24,
            'updated_at' => $settings->updated_at?->toIso8601String(),
        ];
    }

    public function listComplaints(int $tenantId, array $filters = [], int $perPage = 20): LengthAwarePaginator
    {
        $query = ComplaintCase::query()
            ->where('tenant_id', $tenantId)
            ->with(['review.client:id,name,email', 'review:id,rating,uuid', 'assignedUser:id,name'])
            ->latest();

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        return $query->paginate(min($perPage, 50));
    }

    public function formatComplaint(ComplaintCase $case): array
    {
        $case->loadMissing(['review.client:id,name,email', 'review:id,rating,uuid', 'assignedUser:id,name']);

        return [
            'id' => $case->id,
            'uuid' => $case->uuid,
            'reference' => 'CMP-'.$case->id,
            'status' => $case->status?->value ?? $case->status,
            'priority' => 'high',
            'subject' => 'Low rating follow-up',
            'summary' => $case->internal_notes,
            'client_name' => $case->review?->client?->name,
            'owner_name' => $case->assignedUser?->name,
            'opened_at' => $case->created_at?->toIso8601String(),
            'resolved_at' => $case->resolved_at?->toIso8601String(),
            'review' => $case->review ? ['id' => $case->review->id, 'rating' => (int) $case->review->rating] : null,
        ];
    }

    public function formatRequest(ReviewRequest $request): array
    {
        $request->loadMissing(['appointment:id,uuid,starts_at', 'client:id,name,email', 'review:id,uuid,rating,status,review_request_id']);

        return [
            'uuid' => $request->uuid,
            'status' => $request->status,
            'client_email' => $request->client_email,
            'sent_at' => $request->sent_at?->toIso8601String(),
            'completed_at' => $request->completed_at?->toIso8601String(),
            'token' => $request->token,
            'google_review_sent' => (bool) $request->google_review_sent,
            'appointment' => $request->appointment ? [
                'uuid' => $request->appointment->uuid,
                'starts_at' => $request->appointment->starts_at?->toIso8601String(),
            ] : null,
            'client' => $request->client ? [
                'id' => $request->client->id,
                'name' => $request->client->name,
                'email' => $request->client->email,
            ] : null,
            'review' => $request->review ? [
                'uuid' => $request->review->uuid,
                'rating' => (int) $request->review->rating,
                'status' => $request->review->status?->value ?? $request->review->status,
            ] : null,
        ];
    }

    public function formatReview(Review $review): array
    {
        $review->loadMissing(['client:id,name,email', 'staffMember:id,uuid,display_name', 'service:id,uuid,name', 'complaintCase']);

        return [
            'uuid' => $review->uuid,
            'rating' => (int) $review->rating,
            'comment' => $review->comment,
            'status' => $review->status?->value ?? $review->status,
            'is_verified' => (bool) $review->is_verified,
            'source' => $review->source,
            'created_at' => $review->created_at?->toIso8601String(),
            'client' => $review->client ? [
                'id' => $review->client->id,
                'name' => $review->client->name,
            ] : null,
            'staff_member' => $review->staffMember ? [
                'uuid' => $review->staffMember->uuid,
                'display_name' => $review->staffMember->display_name,
            ] : null,
            'service' => $review->service ? [
                'uuid' => $review->service->uuid,
                'name' => $review->service->name,
            ] : null,
            'complaint_case' => $review->complaintCase ? [
                'uuid' => $review->complaintCase->uuid,
                'status' => $review->complaintCase->status?->value ?? $review->complaintCase->status,
            ] : null,
        ];
    }

    private function createComplaintIfNeeded(Review $review): void
    {
        $settings = $this->settings($review->tenant_id);
        if ($review->rating > $settings->low_rating_threshold || $review->complaintCase()->exists()) {
            return;
        }

        ComplaintCase::query()->create([
            'tenant_id' => $review->tenant_id,
            'review_id' => $review->id,
            'status' => ComplaintCaseStatus::Open,
            'internal_notes' => 'Auto-created from low review rating.',
        ]);
    }
}
