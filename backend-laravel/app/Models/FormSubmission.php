<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class FormSubmission extends Model
{
    use BelongsToTenant;

    public function getRouteKeyName(): string
    {
        return 'uuid';
    }

    protected $fillable = [
        'tenant_id',
        'uuid',
        'form_template_id',
        'client_user_id',
        'appointment_id',
        'submitted_by_user_id',
        'status',
        'answers',
        'submitted_at',
    ];

    protected function casts(): array
    {
        return [
            'answers' => 'array',
            'submitted_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (FormSubmission $submission) {
            $submission->uuid ??= (string) Str::uuid();
            $submission->submitted_at ??= now();
        });
    }

    public function template(): BelongsTo
    {
        return $this->belongsTo(FormTemplate::class, 'form_template_id');
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(User::class, 'client_user_id');
    }

    public function submitter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'submitted_by_user_id');
    }
}
