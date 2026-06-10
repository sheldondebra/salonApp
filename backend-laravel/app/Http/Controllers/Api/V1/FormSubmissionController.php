<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\V1\Concerns\ResolvesTenantFromRequest;
use App\Http\Controllers\Controller;
use App\Models\FormSubmission;
use App\Models\FormTemplate;
use App\Services\FormBuilderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FormSubmissionController extends Controller
{
    use ResolvesTenantFromRequest;

    public function __construct(private readonly FormBuilderService $forms) {}

    public function index(Request $request, string $tenantSlug): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);

        $filters = $request->validate([
            'form_template_id' => ['nullable', 'integer'],
            'client_user_id' => ['nullable', 'integer'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        $paginator = $this->forms->paginateSubmissions($tenant->id, $filters, (int) ($filters['per_page'] ?? 20));

        return response()->json([
            'data' => collect($paginator->items())->map(fn (FormSubmission $s) => $this->forms->formatSubmission($s)),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }

    public function show(Request $request, string $tenantSlug, FormSubmission $formSubmission): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);
        abort_unless($formSubmission->tenant_id === $tenant->id, 404);

        return response()->json(['data' => $this->forms->formatSubmission($formSubmission)]);
    }

    public function store(Request $request, string $tenantSlug, FormTemplate $formTemplate): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);
        abort_unless($formTemplate->tenant_id === $tenant->id, 404);

        $data = $request->validate([
            'answers' => ['required', 'array'],
            'client_user_id' => ['nullable', 'integer', 'exists:users,id'],
            'appointment_id' => ['nullable', 'integer', 'exists:appointments,id'],
        ]);

        $submission = $this->forms->submit(
            $formTemplate,
            $data['answers'],
            $request->user(),
            $data['client_user_id'] ?? null,
            $data['appointment_id'] ?? null,
        );

        return response()->json(['data' => $this->forms->formatSubmission($submission)], 201);
    }
}
