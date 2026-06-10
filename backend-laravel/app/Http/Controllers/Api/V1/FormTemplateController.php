<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\V1\Concerns\ResolvesTenantFromRequest;
use App\Http\Controllers\Controller;
use App\Models\FormTemplate;
use App\Services\FormBuilderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class FormTemplateController extends Controller
{
    use ResolvesTenantFromRequest;

    public function __construct(private readonly FormBuilderService $forms) {}

    public function index(Request $request, string $tenantSlug): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);

        $filters = $request->validate([
            'q' => ['nullable', 'string', 'max:100'],
            'is_active' => ['nullable', 'boolean'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        $paginator = $this->forms->paginateTemplates(
            $tenant->id,
            $filters,
            (int) ($filters['per_page'] ?? 20),
        );

        return response()->json([
            'data' => collect($paginator->items())->map(fn (FormTemplate $t) => $this->forms->formatTemplate($t)),
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
            'name' => ['required', 'string', 'max:255'],
            'category' => ['nullable', 'string', 'max:64'],
            'description' => ['nullable', 'string', 'max:5000'],
            'is_active' => ['nullable', 'boolean'],
            'fields' => ['nullable', 'array'],
            'fields.*.field_type' => ['required_with:fields', 'string', Rule::in(array_column(\App\Enums\FormFieldType::cases(), 'value'))],
            'fields.*.label' => ['required_with:fields', 'string', 'max:255'],
            'fields.*.field_key' => ['nullable', 'string', 'max:64'],
            'fields.*.help_text' => ['nullable', 'string', 'max:2000'],
            'fields.*.placeholder' => ['nullable', 'string', 'max:255'],
            'fields.*.options' => ['nullable', 'array'],
            'fields.*.is_required' => ['nullable', 'boolean'],
            'fields.*.sort_order' => ['nullable', 'integer', 'min:0'],
            'fields.*.visible_when' => ['nullable', 'array'],
            'fields.*.visible_when.field_key' => ['nullable', 'string', 'max:64'],
            'fields.*.visible_when.operator' => ['nullable', 'string', Rule::in(['equals', 'not_equals', 'filled'])],
            'fields.*.visible_when.value' => ['nullable'],
        ]);

        $template = $this->forms->createTemplate(
            $tenant->id,
            $data,
            $data['fields'] ?? [],
            $request->user(),
        );

        return response()->json(['data' => $this->forms->formatTemplate($template)], 201);
    }

    public function show(Request $request, string $tenantSlug, FormTemplate $formTemplate): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);
        abort_unless($formTemplate->tenant_id === $tenant->id, 404);

        return response()->json(['data' => $this->forms->showTemplate($formTemplate)]);
    }

    public function update(Request $request, string $tenantSlug, FormTemplate $formTemplate): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);
        abort_unless($formTemplate->tenant_id === $tenant->id, 404);

        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'category' => ['nullable', 'string', 'max:64'],
            'description' => ['nullable', 'string', 'max:5000'],
            'is_active' => ['nullable', 'boolean'],
            'fields' => ['sometimes', 'array'],
            'fields.*.field_type' => ['required_with:fields', 'string', Rule::in(array_column(\App\Enums\FormFieldType::cases(), 'value'))],
            'fields.*.label' => ['required_with:fields', 'string', 'max:255'],
            'fields.*.field_key' => ['nullable', 'string', 'max:64'],
            'fields.*.help_text' => ['nullable', 'string', 'max:2000'],
            'fields.*.placeholder' => ['nullable', 'string', 'max:255'],
            'fields.*.options' => ['nullable', 'array'],
            'fields.*.is_required' => ['nullable', 'boolean'],
            'fields.*.sort_order' => ['nullable', 'integer', 'min:0'],
            'fields.*.visible_when' => ['nullable', 'array'],
        ]);

        $fields = array_key_exists('fields', $data) ? $data['fields'] : null;
        $template = $this->forms->updateTemplate($formTemplate, $data, $fields);

        return response()->json(['data' => $this->forms->formatTemplate($template)]);
    }

    public function destroy(Request $request, string $tenantSlug, FormTemplate $formTemplate): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);
        abort_unless($formTemplate->tenant_id === $tenant->id, 404);

        $this->forms->deleteTemplate($formTemplate);

        return response()->json(['message' => 'Form template deleted.']);
    }

    public function library(Request $request, string $tenantSlug): JsonResponse
    {
        $this->tenant($request, $tenantSlug);

        return response()->json(['data' => $this->forms->library()]);
    }

    public function importLibrary(Request $request, string $tenantSlug): JsonResponse
    {
        $tenant = $this->tenant($request, $tenantSlug);

        $data = $request->validate([
            'slug' => ['required', 'string', 'max:64'],
        ]);

        $template = $this->forms->importFromLibrary($tenant->id, $data['slug'], $request->user());

        return response()->json(['data' => $this->forms->formatTemplate($template)], 201);
    }
}
