<?php

namespace App\Services;

use App\Enums\FormFieldType;
use App\Models\FormField;
use App\Models\FormSubmission;
use App\Models\FormTemplate;
use App\Models\FormTemplateLibrary;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class FormBuilderService
{
    /**
     * @param  array<string, mixed>  $filters
     */
    public function paginateTemplates(int $tenantId, array $filters = [], int $perPage = 20): LengthAwarePaginator
    {
        $query = FormTemplate::query()
            ->where('tenant_id', $tenantId)
            ->withCount('submissions')
            ->orderByDesc('updated_at');

        if (isset($filters['is_active'])) {
            $query->whereBool('is_active', (bool) $filters['is_active']);
        }

        if (! empty($filters['q'])) {
            $term = '%'.$filters['q'].'%';
            $query->where(function ($q) use ($term) {
                $q->where('name', 'like', $term)->orWhere('description', 'like', $term);
            });
        }

        return $query->paginate(min($perPage, 50));
    }

    public function showTemplate(FormTemplate $template): array
    {
        $template->load(['fields' => fn ($q) => $q->orderBy('sort_order')]);

        return $this->formatTemplate($template);
    }

    /**
     * @param  array<string, mixed>  $data
     * @param  list<array<string, mixed>>  $fields
     */
    public function createTemplate(int $tenantId, array $data, array $fields, ?User $actor = null): FormTemplate
    {
        return DB::transaction(function () use ($tenantId, $data, $fields, $actor) {
            $template = FormTemplate::query()->create([
                'tenant_id' => $tenantId,
                'name' => $data['name'],
                'category' => $data['category'] ?? 'general',
                'description' => $data['description'] ?? null,
                'is_active' => $data['is_active'] ?? true,
                'library_slug' => $data['library_slug'] ?? null,
                'created_by_user_id' => $actor?->id,
            ]);

            $this->syncFields($template, $fields);

            return $template->fresh(['fields']);
        });
    }

    /**
     * @param  array<string, mixed>  $data
     * @param  list<array<string, mixed>>|null  $fields
     */
    public function updateTemplate(FormTemplate $template, array $data, ?array $fields = null): FormTemplate
    {
        return DB::transaction(function () use ($template, $data, $fields) {
            if (array_key_exists('name', $data)) {
                $template->name = $data['name'];
            }
            if (array_key_exists('category', $data)) {
                $template->category = $data['category'] ?? 'general';
            }
            if (array_key_exists('description', $data)) {
                $template->description = $data['description'];
            }
            if (array_key_exists('is_active', $data)) {
                $template->is_active = (bool) $data['is_active'];
            }
            $template->save();

            if ($fields !== null) {
                $this->syncFields($template, $fields);
            }

            return $template->fresh(['fields']);
        });
    }

    public function deleteTemplate(FormTemplate $template): void
    {
        $template->delete();
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function library(): array
    {
        return FormTemplateLibrary::query()
            ->whereBool('is_active')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get()
            ->map(fn (FormTemplateLibrary $row) => [
                'slug' => $row->slug,
                'name' => $row->name,
                'category' => $row->category,
                'description' => $row->description,
                'fields' => $row->fields ?? [],
            ])
            ->all();
    }

    public function importFromLibrary(int $tenantId, string $slug, ?User $actor = null): FormTemplate
    {
        $library = FormTemplateLibrary::query()->where('slug', $slug)->whereBool('is_active')->firstOrFail();

        return $this->createTemplate(
            $tenantId,
            [
                'name' => $library->name,
                'category' => $library->category,
                'description' => $library->description,
                'library_slug' => $library->slug,
            ],
            $library->fields ?? [],
            $actor,
        );
    }

    /**
     * @param  array<string, mixed>  $filters
     */
    public function paginateSubmissions(int $tenantId, array $filters = [], int $perPage = 20): LengthAwarePaginator
    {
        $query = FormSubmission::query()
            ->where('tenant_id', $tenantId)
            ->with(['template:id,uuid,name', 'client:id,name,email'])
            ->orderByDesc('submitted_at');

        if (! empty($filters['form_template_id'])) {
            $query->where('form_template_id', (int) $filters['form_template_id']);
        }

        if (! empty($filters['client_user_id'])) {
            $query->where('client_user_id', (int) $filters['client_user_id']);
        }

        return $query->paginate(min($perPage, 50));
    }

    /**
     * @param  array<string, mixed>  $answers
     */
    public function submit(FormTemplate $template, array $answers, ?User $submitter = null, ?int $clientUserId = null, ?int $appointmentId = null): FormSubmission
    {
        $template->load(['fields' => fn ($q) => $q->orderBy('sort_order')]);
        $this->validateAnswers($template, $answers);

        return FormSubmission::query()->create([
            'tenant_id' => $template->tenant_id,
            'form_template_id' => $template->id,
            'client_user_id' => $clientUserId,
            'appointment_id' => $appointmentId,
            'submitted_by_user_id' => $submitter?->id,
            'status' => 'submitted',
            'answers' => $answers,
            'submitted_at' => now(),
        ]);
    }

    /**
     * @param  list<array<string, mixed>>  $fields
     */
    protected function syncFields(FormTemplate $template, array $fields): void
    {
        FormField::query()->where('form_template_id', $template->id)->delete();

        $usedKeys = [];
        foreach (array_values($fields) as $index => $field) {
            $type = FormFieldType::from($field['field_type'] ?? $field['type'] ?? 'text');
            $label = trim((string) ($field['label'] ?? 'Field'));
            $key = $this->uniqueFieldKey($field['field_key'] ?? Str::slug($label, '_') ?: 'field', $usedKeys);
            $usedKeys[] = $key;

            FormField::query()->create([
                'tenant_id' => $template->tenant_id,
                'form_template_id' => $template->id,
                'field_key' => $key,
                'field_type' => $type,
                'label' => $label,
                'help_text' => $field['help_text'] ?? null,
                'placeholder' => $field['placeholder'] ?? null,
                'options' => $field['options'] ?? null,
                'is_required' => (bool) ($field['is_required'] ?? false),
                'sort_order' => (int) ($field['sort_order'] ?? $index),
                'visible_when' => $field['visible_when'] ?? null,
            ]);
        }
    }

    /**
     * @param  array<string, mixed>  $answers
     */
    protected function validateAnswers(FormTemplate $template, array $answers): void
    {
        $errors = [];

        foreach ($template->fields as $field) {
            if ($field->field_type === FormFieldType::Heading) {
                continue;
            }

            if (! $this->fieldIsVisible($field, $answers)) {
                continue;
            }

            $value = $answers[$field->field_key] ?? null;
            $empty = $value === null || $value === '' || (is_array($value) && count($value) === 0);

            if ($field->is_required && $empty) {
                $errors[$field->field_key] = ["{$field->label} is required."];
            }
        }

        if ($errors !== []) {
            throw ValidationException::withMessages($errors);
        }
    }

    /**
     * @param  array<string, mixed>  $answers
     */
    public function fieldIsVisible(FormField $field, array $answers): bool
    {
        $rule = $field->visible_when;
        if (! is_array($rule) || empty($rule['field_key'])) {
            return true;
        }

        $depValue = $answers[$rule['field_key']] ?? null;
        $operator = $rule['operator'] ?? 'equals';
        $expected = $rule['value'] ?? null;

        return match ($operator) {
            'not_equals' => (string) $depValue !== (string) $expected,
            'filled' => ! empty($depValue),
            'equals' => (string) $depValue === (string) $expected,
            default => true,
        };
    }

    /**
     * @param  list<string>  $used
     */
    protected function uniqueFieldKey(string $base, array $used): string
    {
        $key = Str::limit($base, 64, '');
        $candidate = $key;
        $i = 2;
        while (in_array($candidate, $used, true)) {
            $candidate = Str::limit($key.'_'.$i, 64, '');
            $i++;
        }

        return $candidate;
    }

    public function formatTemplate(FormTemplate $template): array
    {
        $template->loadMissing(['fields' => fn ($q) => $q->orderBy('sort_order')]);

        return [
            'uuid' => $template->uuid,
            'name' => $template->name,
            'category' => $template->category,
            'description' => $template->description,
            'is_active' => (bool) $template->is_active,
            'library_slug' => $template->library_slug,
            'submissions_count' => $template->submissions_count ?? $template->submissions()->count(),
            'created_at' => $template->created_at?->toIso8601String(),
            'updated_at' => $template->updated_at?->toIso8601String(),
            'fields' => $template->fields->map(fn (FormField $f) => [
                'field_key' => $f->field_key,
                'field_type' => $f->field_type->value,
                'label' => $f->label,
                'help_text' => $f->help_text,
                'placeholder' => $f->placeholder,
                'options' => $f->options,
                'is_required' => (bool) $f->is_required,
                'sort_order' => (int) $f->sort_order,
                'visible_when' => $f->visible_when,
            ])->values()->all(),
        ];
    }

    public function formatSubmission(FormSubmission $submission): array
    {
        $submission->loadMissing(['template:id,uuid,name', 'client:id,name,email']);

        return [
            'uuid' => $submission->uuid,
            'status' => $submission->status,
            'answers' => $submission->answers ?? [],
            'submitted_at' => $submission->submitted_at?->toIso8601String(),
            'client_user_id' => $submission->client_user_id,
            'client' => $submission->client,
            'template' => $submission->template ? [
                'uuid' => $submission->template->uuid,
                'name' => $submission->template->name,
            ] : null,
        ];
    }
}
