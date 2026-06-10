<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\V1\Concerns\ResolvesTenantFromRequest;
use App\Http\Controllers\Controller;
use App\Models\ApprovalRequest;
use App\Services\ApprovalRequestService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ApprovalRequestController extends Controller
{
    use ResolvesTenantFromRequest;

    public function __construct(
        private readonly ApprovalRequestService $approvals,
    ) {}

    public function inbox(Request $request, string $tenantSlug): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);
        $filters = $request->validate([
            'status' => ['nullable', 'string', 'max:32'],
            'type' => ['nullable', 'string', 'max:64'],
            'is_urgent' => ['nullable', 'boolean'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        $paginator = $this->approvals->inbox($tenant->id, $filters, (int) ($filters['per_page'] ?? 20));

        return response()->json([
            'data' => collect($paginator->items())->map(fn (ApprovalRequest $item) => $this->approvals->formatRequest($item))->values(),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }

    public function store(Request $request, string $tenantSlug): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);
        $data = $request->validate([
            'type' => ['required', 'string', 'max:64'],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'payload' => ['nullable', 'array'],
            'is_urgent' => ['sometimes', 'boolean'],
        ]);

        $approval = $this->approvals->create($tenant->id, $data, $request->user());

        return response()->json([
            'data' => $this->approvals->formatRequest($approval),
        ], 201);
    }

    public function approve(Request $request, string $tenantSlug, ApprovalRequest $approvalRequest): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);
        abort_unless($approvalRequest->tenant_id === $tenant->id, 404);

        $data = $request->validate([
            'review_note' => ['nullable', 'string', 'max:5000'],
        ]);

        $approval = $this->approvals->approve($approvalRequest, $request->user(), $data['review_note'] ?? null);

        return response()->json([
            'data' => $this->approvals->formatRequest($approval),
        ]);
    }

    public function reject(Request $request, string $tenantSlug, ApprovalRequest $approvalRequest): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);
        abort_unless($approvalRequest->tenant_id === $tenant->id, 404);

        $data = $request->validate([
            'review_note' => ['nullable', 'string', 'max:5000'],
        ]);

        $approval = $this->approvals->reject($approvalRequest, $request->user(), $data['review_note'] ?? null);

        return response()->json([
            'data' => $this->approvals->formatRequest($approval),
        ]);
    }
}
