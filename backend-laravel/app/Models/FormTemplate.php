<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use App\Models\Concerns\FixesPgsqlBooleans;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class FormTemplate extends Model
{
    use BelongsToTenant, FixesPgsqlBooleans;

    public function getRouteKeyName(): string
    {
        return 'uuid';
    }

    protected $fillable = [
        'tenant_id',
        'uuid',
        'name',
        'category',
        'description',
        'is_active',
        'library_slug',
        'created_by_user_id',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (FormTemplate $template) {
            $template->uuid ??= (string) Str::uuid();
        });
    }

    public function fields(): HasMany
    {
        return $this->hasMany(FormField::class)->orderBy('sort_order');
    }

    public function submissions(): HasMany
    {
        return $this->hasMany(FormSubmission::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }
}
