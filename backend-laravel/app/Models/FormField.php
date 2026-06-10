<?php

namespace App\Models;

use App\Enums\FormFieldType;
use App\Models\Concerns\BelongsToTenant;
use App\Models\Concerns\FixesPgsqlBooleans;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FormField extends Model
{
    use BelongsToTenant, FixesPgsqlBooleans;

    protected $fillable = [
        'tenant_id',
        'form_template_id',
        'field_key',
        'field_type',
        'label',
        'help_text',
        'placeholder',
        'options',
        'is_required',
        'sort_order',
        'visible_when',
    ];

    protected function casts(): array
    {
        return [
            'field_type' => FormFieldType::class,
            'options' => 'array',
            'is_required' => 'boolean',
            'sort_order' => 'integer',
            'visible_when' => 'array',
        ];
    }

    public function template(): BelongsTo
    {
        return $this->belongsTo(FormTemplate::class, 'form_template_id');
    }
}
