<?php

namespace App\Services;

use App\Enums\ApprovalRequestStatus;
use App\Models\ApprovalRequest;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class ApprovalRequestService
{
    public function inbox(int $tenantId, array $filters = [], int $perPage = 20): LengthAwarePaginator
    {
        $query = ApprovalRequest::query()
            ->where('tenant_id', $tenantId)
            ->with(['requestedBy:id,name,email', 'reviewedBy:id,name,email'])
            ->latest();

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (! empty($filters['type'])) {
            $query->where('type', $filters['type']);
        }

        if (array_key_exists('is_urgent', $filters) && $filters['is_urgent'] !== null) {
            $query->whereBool('is_urgent', (bool) $filters['is_urgent']);
        }

        return $query->paginate(min($perPage, 50));
    }

    public function create(int $tenantId, array $data, ?User $actor = null): ApprovalRequest
    {
        return ApprovalRequest::query()->create([
            'tenant_id' => $tenantId,
            'type' => $data['type'],
            'status' => ApprovalRequestStatus::Pending,
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
            'payload' => $data['payload'] ?? [],
            'requested_by_user_id' => $actor?->id,
            'is_urgent' => $data['is_urgent'] ?? false,
        ])->fresh(['requestedBy', 'reviewedBy']);
    }

    public function approve(ApprovalRequest $request, User $reviewer, ?string $note = null): ApprovalRequest
    {
        $request->update([
            'status' => ApprovalRequestStatus::Approved,
            'reviewed_by_user_id' => $reviewer->id,
            'review_note' => $note,
            'reviewed_at' => now(),
        ]);

        return $request->fresh(['requestedBy', 'reviewedBy']);
    }

    public function reject(ApprovalRequest $request, User $reviewer, ?string $note = null): ApprovalRequest
    {
        $request->update([
            'status' => ApprovalRequestStatus::Rejected,
            'reviewed_by_user_id' => $reviewer->id,
            'review_note' => $note,
            'reviewed_at' => now(),
        ]);

        return $request->fresh(['requestedBy', 'reviewedBy']);
    }

    /** @return array<string, mixed> */
    public function formatRequest(ApprovalRequest $request): array
    {
        return [
            'uuid' => $request->uuid,
            'type' => $request->type,
            'status' => $request->status?->value ?? $request->status,
            'title' => $request->title,
            'description' => $request->description,
            'payload' => $request->payload ?? [],
            'review_note' => $request->review_note,
            'reviewed_at' => $request->reviewed_at?->toIso8601String(),
            'is_urgent' => (bool) $request->is_urgent,
            'requested_by' => $request->requestedBy ? [
                'id' => $request->requestedBy->id,
                'name' => $request->requestedBy->name,
            ] : null,
            'reviewed_by' => $request->reviewedBy ? [
                'id' => $request->reviewedBy->id,
                'name' => $request->reviewedBy->name,
            ] : null,
            'created_at' => $request->created_at?->toIso8601String(),
        ];
    }
}
