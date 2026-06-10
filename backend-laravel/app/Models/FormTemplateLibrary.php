<?php

namespace App\Models;

use App\Models\Concerns\FixesPgsqlBooleans;
use Illuminate\Database\Eloquent\Model;

class FormTemplateLibrary extends Model
{
    use FixesPgsqlBooleans;
    protected $table = 'form_template_library';

    protected $fillable = [
        'slug',
        'name',
        'category',
        'description',
        'fields',
        'is_active',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'fields' => 'array',
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ];
    }
}
